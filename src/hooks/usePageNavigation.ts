import { useCallback, useEffect, useRef, useState } from 'react';
import type { ParsedReport } from '../lib/types';
import {
  PAGE_TYPES,
  PAGE_REPORT_TYPES,
  pageTypeForReport,
  getReportSchema,
  resolveGroupByColumn,
  type PageType,
} from '../lib/report-schema';
import { readURLFilterState, writeURLFilterState } from '../lib/url-state';

interface PageNavigationDeps {
  reports: ParsedReport[];
  activeReport: ParsedReport | null;
  setActiveReport: (index: number) => void;
  setGroupByColumn: (column: string) => void;
  groupByColumn: string;
  timeBucket: string;
  periodKey: string;
  searchQuery: string;
  filters: Record<string, string[]>;
}

interface PageNavigationReturn {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
}

/** Page navigation state with auto-switching on report changes */
export function usePageNavigation({
  reports,
  activeReport,
  setActiveReport,
  setGroupByColumn,
  groupByColumn,
  timeBucket,
  periodKey,
  searchQuery,
  filters,
}: PageNavigationDeps): PageNavigationReturn {
  const [activePage, setActivePageRaw] = useState<PageType>(() => {
    const urlState = readURLFilterState();
    const page = urlState.page as PageType | undefined;
    if (page && Object.values(PAGE_TYPES).includes(page)) return page;
    return PAGE_TYPES.USAGE;
  });

  const setActivePage = useCallback((page: PageType) => {
    setActivePageRaw(page);
    // Filters are intentionally sticky across page switches
    // Files page has no report types
    const reportTypes = PAGE_REPORT_TYPES[page];
    if (!reportTypes || reportTypes.length === 0) return;
    const matchIndex = reports.findIndex((r) => reportTypes.includes(r.type));
    if (matchIndex !== -1) {
      setActiveReport(matchIndex);
      setGroupByColumn(resolveGroupByColumn(reports[matchIndex], ''));
      return;
    }
    setGroupByColumn(getReportSchema(reportTypes[0]).defaultGroupBy);
  }, [setGroupByColumn, reports, setActiveReport]);

  // Sync active page to URL
  useEffect(() => {
    writeURLFilterState({
      page: activePage,
      groupBy: groupByColumn,
      timeBucket,
      period: periodKey,
      search: searchQuery,
      filters,
    });
  }, [activePage, groupByColumn, timeBucket, periodKey, searchQuery, filters]);

  // Auto-select a report matching the current page when reports load or page changes
  useEffect(() => {
    if (reports.length === 0) return;
    const allowedTypes = PAGE_REPORT_TYPES[activePage];
    if (!allowedTypes) return;
    if (activeReport && allowedTypes.includes(activeReport.type)) return;
    const matchIndex = reports.findIndex((r) => allowedTypes.includes(r.type));
    if (matchIndex !== -1) {
      setActiveReport(matchIndex);
    }
  }, [reports, activePage, activeReport, setActiveReport]);

  // Auto-switch page when a NEW report is added (skip initial hydration)
  const prevReportCountRef = useRef(reports.length);
  const isInitialHydrationRef = useRef(true);
  useEffect(() => {
    if (reports.length > prevReportCountRef.current) {
      if (isInitialHydrationRef.current) {
        isInitialHydrationRef.current = false;
      } else if (activeReport) {
        const reportPage = pageTypeForReport(activeReport.type);
        if (reportPage !== activePage) {
          setActivePage(reportPage);
        }
      }
    }
    prevReportCountRef.current = reports.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.length]);

  return { activePage, setActivePage };
}
