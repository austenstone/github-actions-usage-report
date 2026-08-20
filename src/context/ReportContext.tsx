import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ParsedReport, TimeBucket } from '../lib/types';
import { ReportContext } from './report-context';
import type { CombinedGroup, DateRange } from './report-context';
import { getCachedParsedReports, getCachedRawCSV, setCachedCSV, removeCachedCSV, clearCachedCSVs } from '../lib/local-storage';
import { readURLFilterState, writeURLFilterState } from '../lib/url-state';
import { getReportSchema, resolveGroupByColumn } from '../lib/report-schema';
import { formatDateRangeCompact } from '../lib/formatters';

/** Fast FNV-1a hash for dedup — not crypto-grade, just collision-resistant enough for CSV content */
function simpleHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

interface ReportState {
  reports: ParsedReport[];
  /** Raw CSV content parallel to reports[], used for localStorage caching */
  rawCsvs: string[];
  /** FNV-1a hashes of raw CSV content for dedup */
  fileHashes: Set<string>;
  activeReportIndex: number;
  groupByColumn: string;
  timeBucket: TimeBucket;
  periodKey: string;
  dateRange: DateRange | null;
  searchQuery: string;
  filters: Record<string, string[]>;
}

function buildInitialState(): ReportState {
  const urlState = readURLFilterState();
  return {
    reports: [],
    rawCsvs: [],
    fileHashes: new Set(),
    activeReportIndex: 0,
    groupByColumn: urlState.groupBy ?? 'username',
    timeBucket: (urlState.timeBucket as TimeBucket) ?? 'daily',
    periodKey: urlState.period ?? 'all',
    dateRange: null,
    searchQuery: urlState.search ?? '',
    filters: urlState.filters ?? {},
  };
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportState>(buildInitialState);
  const [isHydrating, setIsHydrating] = useState(true);

  // Restore cached CSVs from IndexedDB on mount (async)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    getCachedParsedReports().then(async (cached) => {
      if (cached.length === 0) {
        setIsHydrating(false);
        return;
      }

      const restoredReports = cached.map((e) => e.parsed);

      if (restoredReports.length === 0) {
        setIsHydrating(false);
        return;
      }

      // Render immediately with parsed data (no raw CSVs yet)
      setState((prev) => {
        if (prev.reports.length > 0) return prev;

        const urlState = readURLFilterState();
        // Validate against ALL restored reports so cross-report filters survive
        const allRows = restoredReports.flatMap((r) => r.rows) as unknown as Record<string, unknown>[];

        let validPeriodKey = urlState.period ?? 'all';
        if (validPeriodKey !== 'all') {
          const availablePeriods = [
            ...new Set(allRows.map((row) => String(row.date ?? '').slice(0, 7))),
          ].filter(Boolean);
          if (!availablePeriods.includes(validPeriodKey)) {
            validPeriodKey = 'all';
          }
        }

        const validFilters: Record<string, string[]> = {};
        const rawFilters = urlState.filters ?? {};
        for (const [field, values] of Object.entries(rawFilters)) {
          const dataValues = new Set(allRows.map((r) => String(r[field] ?? '').toLowerCase()));
          const kept = values.filter((v) => dataValues.has(v.toLowerCase()));
          if (kept.length > 0) validFilters[field] = kept;
        }

        return {
          ...prev,
          reports: restoredReports,
          rawCsvs: cached.map(() => ''), // placeholder, backfilled below
          activeReportIndex: 0,
          periodKey: validPeriodKey,
          filters: validFilters,
        };
      });
      setIsHydrating(false);

      // Backfill raw CSVs in background (needed for dedup + re-export)
      const rawCsvs = await Promise.all(
        cached.map(async (e) => (await getCachedRawCSV(e.fileName)) ?? ''),
      );
      setState((prev) => {
        // Guard: if user added reports while we were fetching raw CSVs,
        // only backfill the original hydrated slots (don't clobber new ones)
        const hydratedCount = restoredReports.length;
        if (prev.reports.length > hydratedCount) {
          const merged = [...rawCsvs, ...prev.rawCsvs.slice(hydratedCount)];
          return {
            ...prev,
            rawCsvs: merged,
            fileHashes: new Set(merged.map((c) => simpleHash(c))),
          };
        }
        return {
          ...prev,
          rawCsvs,
          fileHashes: new Set(rawCsvs.map((c) => simpleHash(c))),
        };
      });
    });
  }, []);

  // Sync filter state to URL params whenever it changes
  useEffect(() => {
    // Only sync URL params when we have reports loaded (avoid clearing URL on initial empty state)
    if (state.reports.length === 0) return;

    writeURLFilterState({
      groupBy: state.groupByColumn,
      timeBucket: state.timeBucket,
      period: state.periodKey,
      search: state.searchQuery,
      filters: state.filters,
    });
  }, [
    state.groupByColumn,
    state.timeBucket,
    state.periodKey,
    state.searchQuery,
    state.filters,
    state.reports.length,
  ]);

  const addReport = useCallback((report: ParsedReport, rawCsv: string): number => {
    let dupeIndex = -1;
    setState((prev) => {
      const hash = simpleHash(rawCsv);
      if (prev.fileHashes.has(hash)) {
        // Find the matching report index
        dupeIndex = prev.rawCsvs.findIndex((csv) => simpleHash(csv) === hash);
        // Navigate to the existing report and reset filters so data loads clean
        return {
          ...prev,
          activeReportIndex: dupeIndex,
          periodKey: 'all',
          dateRange: null,
          searchQuery: '',
          filters: {},
        };
      }

      // Auto-remove sample/demo data when real data is imported
      let baseReports = prev.reports;
      let baseRawCsvs = prev.rawCsvs;
      let baseHashes = prev.fileHashes;
      if (!report.isSample && prev.reports.some((r) => r.isSample)) {
        const realIndices = prev.reports
          .map((r, i) => (r.isSample ? -1 : i))
          .filter((i) => i >= 0);
        baseReports = realIndices.map((i) => prev.reports[i]);
        baseRawCsvs = realIndices.map((i) => prev.rawCsvs[i]);
        baseHashes = new Set(baseRawCsvs.map((csv) => simpleHash(csv)));
        // Clean up IndexedDB for removed sample reports
        for (const r of prev.reports) {
          if (r.isSample) removeCachedCSV(r.fileName);
        }
      }

      const nextReports = [...baseReports, report];
      const nextRawCsvs = [...baseRawCsvs, rawCsv];
      const nextHashes = new Set(baseHashes);
      nextHashes.add(hash);

      // Persist raw + parsed to IndexedDB by filename
      setCachedCSV(report.fileName, rawCsv, report);

      return {
        ...prev,
        reports: nextReports,
        rawCsvs: nextRawCsvs,
        fileHashes: nextHashes,
        activeReportIndex: baseReports.length,
        groupByColumn: resolveGroupByColumn(report, prev.groupByColumn),
        periodKey: 'all',
        dateRange: null,
        searchQuery: '',
      };
    });
    return dupeIndex;
  }, []);

  const removeReport = useCallback((index: number) => {
    setState((prev) => {
      // Remove from localStorage by filename
      const removedReport = prev.reports[index];
      if (removedReport) removeCachedCSV(removedReport.fileName);

      const reports = prev.reports.filter((_, i) => i !== index);
      const rawCsvs = prev.rawCsvs.filter((_, i) => i !== index);

      // If in combined view and only 0-1 reports remain, snap to index 0
      let nextIndex = prev.activeReportIndex;
      if (nextIndex < 0 && reports.length <= 1) {
        nextIndex = 0;
      } else if (nextIndex >= 0) {
        nextIndex = Math.min(nextIndex, Math.max(0, reports.length - 1));
      }

      return {
        ...prev,
        reports,
        rawCsvs,
        fileHashes: new Set(rawCsvs.map(simpleHash)),
        activeReportIndex: nextIndex,
      };
    });
  }, []);

  const clearAllReports = useCallback(() => {
    clearCachedCSVs();
    setState((prev) => ({
      ...prev,
      reports: [],
      rawCsvs: [],
      fileHashes: new Set<string>(),
      activeReportIndex: 0,
    }));
  }, []);

  const setActiveReport = useCallback((index: number) => {
    setState((prev) => {
      // Reset period/filters when switching reports so the full date range is visible
      return {
        ...prev,
        activeReportIndex: index,
        periodKey: 'all',
        dateRange: null,
        searchQuery: '',
      };
    });
  }, []);

  const setGroupByColumn = useCallback((column: string) => {
    setState((prev) => ({ ...prev, groupByColumn: column }));
  }, []);

  const setTimeBucket = useCallback((bucket: TimeBucket) => {
    setState((prev) => ({ ...prev, timeBucket: bucket }));
  }, []);

  const setPeriodKey = useCallback((periodKey: string) => {
    startTransition(() => setState((prev) => ({ ...prev, periodKey, dateRange: null })));
  }, []);

  const setDateRange = useCallback((dateRange: DateRange | null) => {
    startTransition(() => setState((prev) => ({ ...prev, dateRange, periodKey: dateRange ? 'custom' : 'all' })));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    startTransition(() => setState((prev) => ({ ...prev, searchQuery })));
  }, []);

  const setFilter = useCallback((column: string, values: string[]) => {
    startTransition(() => {
    setState((prev) => {
      const nextFilters = { ...prev.filters };

      if (values.length > 0) {
        nextFilters[column] = values;
      } else {
        delete nextFilters[column];
      }

      return {
        ...prev,
        filters: nextFilters,
      };
    });
    });
  }, []);

  const clearFilters = useCallback(() => {
    startTransition(() => setState((prev) => ({ ...prev, filters: {} })));
  }, []);

  // Compute enterprise-aware combined groups: group same-type reports that
  // share ≥3 orgs (each org is unique per enterprise, so 3 matches = same enterprise).
  const combinedGroups = useMemo((): CombinedGroup[] => {
    if (state.reports.length < 2) return [];

    const MIN_ORG_OVERLAP = 3;

    // Extract org sets per report (cheap: just collect unique org strings)
    const reportOrgSets = state.reports.map((report) => {
      const orgs = new Set<string>();
      for (const row of report.rows) {
        const org = (row as unknown as Record<string, unknown>).organization;
        if (org) orgs.add(String(org));
      }
      return orgs;
    });

    // Count overlapping orgs between two sets
    const countOverlap = (a: Set<string>, b: Set<string>): number => {
      let count = 0;
      const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
      for (const v of smaller) {
        if (larger.has(v)) {
          count++;
          if (count >= MIN_ORG_OVERLAP) return count; // early exit
        }
      }
      return count;
    };

    // Union-Find to cluster same-type reports with ≥3 shared orgs
    const parent = state.reports.map((_, i) => i);
    const find = (x: number): number =>
      parent[x] === x ? x : (parent[x] = find(parent[x]));
    const union = (a: number, b: number) => {
      parent[find(a)] = find(b);
    };

    for (let i = 0; i < state.reports.length; i++) {
      for (let j = i + 1; j < state.reports.length; j++) {
        if (state.reports[i].type !== state.reports[j].type) continue;

        const sizeA = reportOrgSets[i].size;
        const sizeB = reportOrgSets[j].size;

        // Both reports have no org data: combine freely (personal accounts, non-enterprise)
        if (sizeA === 0 && sizeB === 0) {
          union(i, j);
          continue;
        }

        // One has orgs, the other doesn't: don't combine (likely different sources)
        if (sizeA === 0 || sizeB === 0) continue;

        // Both have orgs: require ≥3 shared (or all shared if fewer than 3 total)
        const threshold = Math.min(MIN_ORG_OVERLAP, Math.min(sizeA, sizeB));
        if (countOverlap(reportOrgSets[i], reportOrgSets[j]) >= threshold) {
          union(i, j);
        }
      }
    }

    // Collect clusters
    const clusters = new Map<number, number[]>();
    for (let i = 0; i < state.reports.length; i++) {
      const root = find(i);
      const existing = clusters.get(root);
      if (existing) existing.push(i);
      else clusters.set(root, [i]);
    }

    // Only create groups with 2+ reports
    const groups: CombinedGroup[] = [];
    let negativeIndex = -1;
    for (const indices of clusters.values()) {
      if (indices.length < 2) continue;
      groups.push({
        index: negativeIndex,
        label: '', // finalized below
        type: state.reports[indices[0]].type,
        reportIndices: indices,
      });
      negativeIndex--;
    }

    // Finalize labels: use schema label + spanning date range (e.g. "Premium Requests (Feb–Mar 2026)")
    for (const group of groups) {
      const matchingReports = group.reportIndices.map((i) => state.reports[i]);
      const starts = matchingReports.map((r) => r.dateRange.start).sort();
      const ends = matchingReports.map((r) => r.dateRange.end).sort();
      const typeLabel = getReportSchema(group.type).label;
      const dateLabel = formatDateRangeCompact(starts[0], ends[ends.length - 1]);

      if (groups.length > 1) {
        // Multiple combined groups: add org context to disambiguate
        const orgs = new Set<string>();
        for (const idx of group.reportIndices) {
          for (const row of state.reports[idx].rows) {
            const org = (row as unknown as Record<string, unknown>).organization;
            if (org) orgs.add(String(org));
          }
        }
        const sortedOrgs = [...orgs].sort();
        const orgSuffix = sortedOrgs.length <= 2
          ? sortedOrgs.join(', ')
          : `${sortedOrgs[0]} +${sortedOrgs.length - 1}`;
        group.label = dateLabel ? `${typeLabel} (${dateLabel}) · ${orgSuffix}` : `${typeLabel} · ${orgSuffix}`;
      } else {
        group.label = dateLabel ? `${typeLabel} (${dateLabel})` : typeLabel;
      }
    }

    return groups;
  }, [state.reports]);

  // Build a synthetic merged report for combined views (negative index)
  const activeReport = useMemo((): ParsedReport | null => {
    if (state.activeReportIndex >= 0) {
      return state.reports[state.activeReportIndex] ?? null;
    }

    // Find the combined group matching this negative index
    const group = combinedGroups.find((g) => g.index === state.activeReportIndex);
    if (!group) {
      // Fallback: if no group matches (e.g., stale index), show first report
      return state.reports[0] ?? null;
    }

    const matchingReports = group.reportIndices.map((i) => state.reports[i]);
    const allRows = matchingReports.flatMap((r) => r.rows);
    const starts = matchingReports.map((r) => r.dateRange.start).sort();
    const ends = matchingReports.map((r) => r.dateRange.end).sort();

    return {
      type: group.type,
      rows: allRows,
      fileName: group.label,
      rowCount: allRows.length,
      dateRange: {
        start: starts[0],
        end: ends[ends.length - 1],
      },
    };
  }, [state.reports, state.activeReportIndex, combinedGroups]);

  const activeReportType = activeReport?.type ?? null;
  const normalizedSearchQuery = state.searchQuery.trim().toLowerCase();

  const visibleRows = useMemo(() => {
    // Resolve the date field used for period filtering per report type
    const dateFieldMap: Record<string, string> = {
      ghas_active_committers: 'lastPushedDate',
      copilot_seat_activity: 'lastActivityAt',
      dormant_users: 'createdAt',
    };
    const dateField = dateFieldMap[activeReport?.type ?? ''] ?? 'date';

    return (activeReport?.rows ?? []).filter((row) => {
      const rowRecord = row as unknown as Record<string, unknown>;
      const dateValue = String(rowRecord[dateField] ?? '').slice(0, 10); // normalize ISO datetimes to YYYY-MM-DD
      const matchesPeriod =
        state.periodKey === 'all' ||
        (state.dateRange
          ? dateValue >= state.dateRange.start &&
            dateValue <= state.dateRange.end
          : dateValue.startsWith(state.periodKey));

      const matchesAdvancedFilters = Object.entries(state.filters).every(([field, values]) => {
        if (values.length === 0) return true;

        const currentValue = String(rowRecord[field] ?? '').toLowerCase();

        // Separate include vs exclude (negated with '!' prefix) values
        const excludes = values.filter((v) => v.startsWith('!')).map((v) => v.slice(1).toLowerCase());
        const includes = values.filter((v) => !v.startsWith('!')).map((v) => v.toLowerCase());

        // If any exclude matches, reject the row
        if (excludes.length > 0 && excludes.includes(currentValue)) return false;
        // If there are include values, the row must match one of them
        if (includes.length > 0 && !includes.some((v) => currentValue === v)) return false;

        return true;
      });

      if (!matchesPeriod || !matchesAdvancedFilters) return false;
      if (!normalizedSearchQuery) return true;

      return Object.values(rowRecord).some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(normalizedSearchQuery),
      );
    });
  }, [activeReport, state.periodKey, state.dateRange, state.filters, normalizedSearchQuery]);

  return (
    <ReportContext.Provider
      value={{
        ...state,
        isHydrating,
        addReport,
        removeReport,
        clearAllReports,
        setActiveReport,
        setGroupByColumn,
        setTimeBucket,
        setPeriodKey,
        setDateRange,
        setSearchQuery,
        setFilter,
        clearFilters,
        activeReport,
        activeReportType,
        visibleRows,
        combinedGroups,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}
