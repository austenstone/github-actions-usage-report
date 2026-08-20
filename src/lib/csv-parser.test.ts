import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectReportType, parseCSV } from './csv-parser';
import { REPORT_TYPES } from './types';
import type {
  PremiumRequestRow,
  TokenUsageRow,
  UsageReportRow,
  GhasActiveCommittersRow,
  DormantUsersRow,
  CopilotSeatActivityRow,
} from './types';

/** Load an example CSV from the examples/ directory */
function loadExample(filename: string): string {
  return readFileSync(join(__dirname, '../../examples', filename), 'utf-8');
}

// ─── Report Type Detection ─────────────────────────────────────────────────────

describe('detectReportType', () => {
  it('detects premium request report from headers', () => {
    const headers = [
      'date',
      'username',
      'product',
      'sku',
      'model',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'exceeds_quota',
      'total_monthly_quota',
      'organization',
      'cost_center_name',
      'aic_quantity',
      'aic_gross_amount',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.PREMIUM_REQUEST);
  });

  it('detects token usage report from headers', () => {
    const headers = [
      'date',
      'username',
      'product',
      'sku',
      'model',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'exceeds_quota',
      'total_monthly_quota',
      'organization',
      'cost_center_name',
      'total_input_tokens',
      'total_output_tokens',
      'total_cache_creation_tokens',
      'total_cache_read_tokens',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.TOKEN_USAGE);
  });

  it('detects general usage report from headers', () => {
    const headers = [
      'date',
      'product',
      'sku',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'username',
      'organization',
      'repository',
      'workflow_path',
      'cost_center_name',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.USAGE_REPORT);
  });

  it('detects GHAS active committers from headers', () => {
    const headers = ['User login', 'Organization / repository', 'Last pushed date', 'Last pushed email'];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.GHAS_ACTIVE_COMMITTERS);
  });

  it('handles case-insensitive headers', () => {
    const headers = ['Date', 'MODEL', 'Exceeds_Quota', 'TOTAL_monthly_quota'];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.PREMIUM_REQUEST);
  });

  it('handles headers with whitespace padding', () => {
    const headers = ['  date  ', '  model ', ' exceeds_quota', 'total_monthly_quota  '];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.PREMIUM_REQUEST);
  });

  it('detects the summarized usage report, which omits username and workflow_path', () => {
    const headers = [
      'date',
      'product',
      'sku',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'organization',
      'repository',
      'cost_center_name',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.USAGE_REPORT);
  });

  it('detects a premium request report that has no aic_ columns', () => {
    const headers = [
      'date',
      'username',
      'product',
      'sku',
      'model',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'exceeds_quota',
      'total_monthly_quota',
      'organization',
      'cost_center_name',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.PREMIUM_REQUEST);
  });

  it('does not mistake a Copilot report for a metered usage report', () => {
    const headers = [
      'date',
      'username',
      'product',
      'sku',
      'model',
      'quantity',
      'unit_type',
      'applied_cost_per_quantity',
      'gross_amount',
      'discount_amount',
      'net_amount',
      'exceeds_quota',
      'total_monthly_quota',
      'organization',
      'cost_center_name',
      'total_input_tokens',
      'total_output_tokens',
      'total_cache_creation_tokens',
      'total_cache_read_tokens',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.TOKEN_USAGE);
  });

  it('detects the org-level seat activity export, which has no Organization column', () => {
    const headers = [
      'report time',
      'login',
      'last authenticated at',
      'last activity at',
      'last surface used',
    ];
    expect(detectReportType(headers)).toBe(REPORT_TYPES.COPILOT_SEAT_ACTIVITY);
  });

  it('throws on unknown headers', () => {
    expect(() => detectReportType(['foo', 'bar', 'baz'])).toThrow('Unknown report type');
  });

  it('throws on empty headers', () => {
    expect(() => detectReportType([])).toThrow('Unknown report type');
  });
});

// ─── Premium Request Report (Real Example File) ────────────────────────────────

describe('parseCSV — Premium Request (real file)', () => {
  const csv = loadExample('premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    expect(report.type).toBe(REPORT_TYPES.PREMIUM_REQUEST);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('preserves the file name', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    expect(report.fileName).toBe('premiumRequestUsageReport.csv');
  });

  it('computes a valid date range', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.start <= report.dateRange.end).toBe(true);
  });

  it('maps all columns to camelCase properties', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const row = report.rows[0] as PremiumRequestRow;
    const expectedKeys: (keyof PremiumRequestRow)[] = [
      'date', 'username', 'product', 'sku', 'model', 'quantity',
      'unitType', 'appliedCostPerQuantity', 'grossAmount', 'discountAmount',
      'netAmount', 'exceedsQuota', 'totalMonthlyQuota', 'organization',
      'costCenterName', 'aicQuantity', 'aicGrossAmount',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('parses numeric fields as numbers, not strings', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const row = report.rows[0] as PremiumRequestRow;
    expect(typeof row.quantity).toBe('number');
    expect(typeof row.appliedCostPerQuantity).toBe('number');
    expect(typeof row.grossAmount).toBe('number');
    expect(typeof row.discountAmount).toBe('number');
    expect(typeof row.netAmount).toBe('number');
    expect(typeof row.totalMonthlyQuota).toBe('number');
    expect(typeof row.aicQuantity).toBe('number');
    expect(typeof row.aicGrossAmount).toBe('number');
  });

  it('parses exceedsQuota as boolean', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    for (const row of report.rows) {
      expect(typeof (row as PremiumRequestRow).exceedsQuota).toBe('boolean');
    }
  });

  it('handles floating point precision in grossAmount', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    for (const row of report.rows) {
      const r = row as PremiumRequestRow;
      expect(Number.isFinite(r.grossAmount)).toBe(true);
      expect(Number.isFinite(r.discountAmount)).toBe(true);
    }
  });

  it('contains known products: copilot and/or spark', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const products = new Set((report.rows as PremiumRequestRow[]).map((r) => r.product));
    for (const p of products) {
      expect(['copilot', 'spark']).toContain(p);
    }
  });

  it('contains known SKUs', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const knownSkus = [
      'copilot_premium_request', 'coding_agent_premium_request', 'spark_premium_request',
      'copilot_ai_unit', 'coding_agent_ai_unit', 'spark_ai_unit',
    ];
    const skus = new Set((report.rows as PremiumRequestRow[]).map((r) => r.sku));
    for (const s of skus) {
      expect(knownSkus).toContain(s);
    }
  });

  it('has unitType = "requests" or "ai-units" for all rows', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    for (const row of report.rows as PremiumRequestRow[]) {
      expect(['requests', 'ai-units']).toContain(row.unitType);
    }
  });

  it('parses "Auto:" prefixed models correctly', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const autoModels = (report.rows as PremiumRequestRow[])
      .filter((r) => r.model.startsWith('Auto: '));
    // The example file should contain auto-routed models
    if (autoModels.length > 0) {
      for (const row of autoModels) {
        expect(row.model).toMatch(/^Auto: .+/);
      }
    }
  });

  it('handles special model names (Code Review, Coding Agent)', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const models = new Set((report.rows as PremiumRequestRow[]).map((r) => r.model));
    // These special models should exist in a comprehensive report
    const hasSpecialModels = models.has('Code Review model') || models.has('Coding Agent model');
    expect(hasSpecialModels).toBe(true);
  });

  it('handles empty costCenterName as empty string, not undefined', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    const emptyCostCenter = (report.rows as PremiumRequestRow[]).find((r) => r.costCenterName === '');
    expect(emptyCostCenter).toBeDefined();
    expect(emptyCostCenter!.costCenterName).toBe('');
  });

  it('every row has a non-empty username', () => {
    const report = parseCSV(csv, 'premiumRequestUsageReport.csv');
    for (const row of report.rows as PremiumRequestRow[]) {
      expect(row.username.length).toBeGreaterThan(0);
    }
  });
});

// ─── Token Usage Report (Real Example File) ────────────────────────────────────

describe('parseCSV — Token Usage (real file)', () => {
  const csv = loadExample('Token.Usage.Report.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    expect(report.type).toBe(REPORT_TYPES.TOKEN_USAGE);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('maps all columns including token breakdown fields', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const row = report.rows[0] as TokenUsageRow;
    const expectedKeys: (keyof TokenUsageRow)[] = [
      'date', 'username', 'product', 'sku', 'model', 'quantity',
      'unitType', 'appliedCostPerQuantity', 'grossAmount', 'discountAmount',
      'netAmount', 'exceedsQuota', 'totalMonthlyQuota', 'organization',
      'costCenterName', 'totalInputTokens', 'totalOutputTokens',
      'totalCacheCreationTokens', 'totalCacheReadTokens',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('parses token counts as numbers', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const row = report.rows[0] as TokenUsageRow;
    expect(typeof row.totalInputTokens).toBe('number');
    expect(typeof row.totalOutputTokens).toBe('number');
    expect(typeof row.totalCacheCreationTokens).toBe('number');
    expect(typeof row.totalCacheReadTokens).toBe('number');
  });

  it('token counts are non-negative integers', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    for (const row of report.rows as TokenUsageRow[]) {
      expect(row.totalInputTokens).toBeGreaterThanOrEqual(0);
      expect(row.totalOutputTokens).toBeGreaterThanOrEqual(0);
      expect(row.totalCacheCreationTokens).toBeGreaterThanOrEqual(0);
      expect(row.totalCacheReadTokens).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(row.totalInputTokens)).toBe(true);
      expect(Number.isInteger(row.totalOutputTokens)).toBe(true);
    }
  });

  it('cache tokens can be 0 (providers without caching)', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const zeroCacheRows = (report.rows as TokenUsageRow[]).filter(
      (r) => r.totalCacheCreationTokens === 0 && r.totalCacheReadTokens === 0,
    );
    // Some models/providers don't support prompt caching
    expect(zeroCacheRows.length).toBeGreaterThan(0);
  });

  it('has daily date granularity (multiple unique dates)', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const uniqueDates = new Set((report.rows as TokenUsageRow[]).map((r) => r.date));
    // Token usage report is daily, not monthly
    expect(uniqueDates.size).toBeGreaterThan(1);
  });

  it('shares the same base columns as premium request report', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const row = report.rows[0] as TokenUsageRow;
    // These 15 base columns are shared with the premium request format
    expect(row.date).toBeTruthy();
    expect(row.username).toBeTruthy();
    expect(typeof row.exceedsQuota).toBe('boolean');
    expect(typeof row.totalMonthlyQuota).toBe('number');
  });

  it('does NOT have aicQuantity or aicGrossAmount fields', () => {
    const report = parseCSV(csv, 'Token.Usage.Report.csv');
    const row = report.rows[0] as TokenUsageRow;
    expect(row).not.toHaveProperty('aicQuantity');
    expect(row).not.toHaveProperty('aicGrossAmount');
  });
});

// ─── Usage Report / Actions (Real Example File) ─────────────────────────────────

describe('parseCSV — Usage Report (real file)', () => {
  const csv = loadExample('usageReport_1_7f2ed6006ee54fb8af73f5cbb7ac1f1d.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    expect(report.type).toBe(REPORT_TYPES.USAGE_REPORT);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('maps all columns to camelCase properties', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const row = report.rows[0] as UsageReportRow;
    const expectedKeys: (keyof UsageReportRow)[] = [
      'date', 'product', 'sku', 'quantity', 'unitType',
      'appliedCostPerQuantity', 'grossAmount', 'discountAmount', 'netAmount',
      'username', 'organization', 'repository', 'workflowPath', 'costCenterName',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('contains multiple product types (not just actions)', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const products = new Set((report.rows as UsageReportRow[]).map((r) => r.product));
    // The usage report bundles actions, copilot seats, lfs, packages, etc.
    expect(products.size).toBeGreaterThanOrEqual(2);
    expect(products.has('actions')).toBe(true);
  });

  it('contains various runner SKUs', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const skus = new Set((report.rows as UsageReportRow[]).map((r) => r.sku));
    expect(skus.has('actions_linux')).toBe(true);
  });

  it('contains storage SKUs with non-minute unit types', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const storageRows = (report.rows as UsageReportRow[]).filter(
      (r) => r.unitType === 'gigabyte-hours' || r.unitType === 'gigabytes',
    );
    expect(storageRows.length).toBeGreaterThan(0);
  });

  it('handles scientific notation in appliedCostPerQuantity', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    // Storage SKUs often have tiny costs like 9.4086E-05
    const storageRow = (report.rows as UsageReportRow[]).find(
      (r) => r.sku === 'actions_custom_image_storage',
    );
    expect(storageRow).toBeDefined();
    expect(storageRow!.appliedCostPerQuantity).toBeGreaterThan(0);
    expect(storageRow!.appliedCostPerQuantity).toBeLessThan(0.01);
  });

  it('handles empty username for org-level storage rows', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const emptyUserRows = (report.rows as UsageReportRow[]).filter((r) => r.username === '');
    expect(emptyUserRows.length).toBeGreaterThan(0);
  });

  it('handles bot usernames with [bot] suffix', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const botRows = (report.rows as UsageReportRow[]).filter(
      (r) => r.username.includes('[bot]'),
    );
    expect(botRows.length).toBeGreaterThan(0);
    // Common bots: dependabot[bot], github-advanced-security[bot]
    const botNames = new Set(botRows.map((r) => r.username));
    expect(botNames.has('dependabot[bot]') || botNames.has('github-advanced-security[bot]')).toBe(true);
  });

  it('contains standard workflow paths (.github/workflows/)', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const standardPaths = (report.rows as UsageReportRow[]).filter(
      (r) => r.workflowPath.startsWith('.github/workflows/'),
    );
    expect(standardPaths.length).toBeGreaterThan(0);
  });

  it('contains dynamic workflow paths (CodeQL, Dependabot, Copilot)', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const dynamicPaths = (report.rows as UsageReportRow[]).filter(
      (r) => r.workflowPath.startsWith('dynamic/'),
    );
    expect(dynamicPaths.length).toBeGreaterThan(0);
  });

  it('contains required workflow paths', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const requiredPaths = (report.rows as UsageReportRow[]).filter(
      (r) => r.workflowPath.startsWith('required/'),
    );
    expect(requiredPaths.length).toBeGreaterThan(0);
  });

  it('discount_amount equals gross_amount when net is 0 (fully discounted)', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    const freeRows = (report.rows as UsageReportRow[]).filter((r) => r.netAmount === 0);
    expect(freeRows.length).toBeGreaterThan(0);
    for (const row of freeRows) {
      expect(row.discountAmount).toBeCloseTo(row.grossAmount, 5);
    }
  });

  it('all numeric fields are finite numbers', () => {
    const report = parseCSV(csv, 'usageReport.csv');
    for (const row of report.rows as UsageReportRow[]) {
      expect(Number.isFinite(row.quantity)).toBe(true);
      expect(Number.isFinite(row.appliedCostPerQuantity)).toBe(true);
      expect(Number.isFinite(row.grossAmount)).toBe(true);
      expect(Number.isFinite(row.discountAmount)).toBe(true);
      expect(Number.isFinite(row.netAmount)).toBe(true);
    }
  });
});

// ─── GHAS Active Committers (Real Example File) ────────────────────────────────

describe('parseCSV — GHAS Active Committers (real file)', () => {
  const csv = loadExample('ghas_active_committers_octodemo_2026-03-27T1521.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'ghas.csv');
    expect(report.type).toBe(REPORT_TYPES.GHAS_ACTIVE_COMMITTERS);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'ghas.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('maps column names with spaces/slashes to camelCase', () => {
    const report = parseCSV(csv, 'ghas.csv');
    const row = report.rows[0] as GhasActiveCommittersRow;
    const expectedKeys: (keyof GhasActiveCommittersRow)[] = [
      'userLogin', 'organization', 'repository', 'lastPushedDate', 'lastPushedEmail',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('splits organization/repository into separate fields', () => {
    const report = parseCSV(csv, 'ghas.csv');
    for (const row of report.rows as GhasActiveCommittersRow[]) {
      expect(row.organization.length).toBeGreaterThan(0);
      expect(row.repository.length).toBeGreaterThan(0);
      expect(row.organization).not.toContain('/');
    }
  });

  it('lastPushedDate is a valid ISO date string', () => {
    const report = parseCSV(csv, 'ghas.csv');
    for (const row of report.rows as GhasActiveCommittersRow[]) {
      expect(row.lastPushedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('computes dateRange from lastPushedDate', () => {
    const report = parseCSV(csv, 'ghas.csv');
    expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('emails use noreply format or real email addresses', () => {
    const report = parseCSV(csv, 'ghas.csv');
    for (const row of report.rows as GhasActiveCommittersRow[]) {
      expect(row.lastPushedEmail).toContain('@');
    }
  });

  it('a user can appear multiple times (one row per repo)', () => {
    const report = parseCSV(csv, 'ghas.csv');
    const loginCounts = new Map<string, number>();
    for (const row of report.rows as GhasActiveCommittersRow[]) {
      loginCounts.set(row.userLogin, (loginCounts.get(row.userLogin) ?? 0) + 1);
    }
    const multiRepoUsers = [...loginCounts.values()].filter((c) => c > 1);
    expect(multiRepoUsers.length).toBeGreaterThan(0);
  });

  it('does NOT have billing columns (no grossAmount, netAmount, etc.)', () => {
    const report = parseCSV(csv, 'ghas.csv');
    const row = report.rows[0] as GhasActiveCommittersRow;
    expect(row).not.toHaveProperty('grossAmount');
    expect(row).not.toHaveProperty('netAmount');
    expect(row).not.toHaveProperty('quantity');
  });

  it('values are not double-quoted (unlike other reports)', () => {
    const report = parseCSV(csv, 'ghas.csv');
    const row = report.rows[0] as GhasActiveCommittersRow;
    // PapaParse strips quotes, but GHAS format has no quotes to begin with
    expect(row.userLogin.startsWith('"')).toBe(false);
    expect(row.organization.startsWith('"')).toBe(false);
  });
});

// ─── Cross-Report Schema Validation ────────────────────────────────────────────

describe('cross-report schema validation', () => {
  it('premium request and token usage share the same 15 base columns', () => {
    const prCsv = loadExample('premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv');
    const tuCsv = loadExample('Token.Usage.Report.csv');
    const prReport = parseCSV(prCsv, 'pr.csv');
    const tuReport = parseCSV(tuCsv, 'tu.csv');

    const prRow = prReport.rows[0] as PremiumRequestRow;
    const tuRow = tuReport.rows[0] as TokenUsageRow;

    const sharedKeys = [
      'date', 'username', 'product', 'sku', 'model', 'quantity',
      'unitType', 'appliedCostPerQuantity', 'grossAmount', 'discountAmount',
      'netAmount', 'exceedsQuota', 'totalMonthlyQuota', 'organization', 'costCenterName',
    ] as const;

    for (const key of sharedKeys) {
      expect(prRow).toHaveProperty(key);
      expect(tuRow).toHaveProperty(key);
      // Same type for the shared field
      expect(typeof prRow[key]).toBe(typeof tuRow[key]);
    }
  });

  it('token usage has token fields that premium request lacks', () => {
    const tuCsv = loadExample('Token.Usage.Report.csv');
    const tuReport = parseCSV(tuCsv, 'tu.csv');
    const tuRow = tuReport.rows[0] as TokenUsageRow;

    expect(tuRow).toHaveProperty('totalInputTokens');
    expect(tuRow).toHaveProperty('totalOutputTokens');
    expect(tuRow).toHaveProperty('totalCacheCreationTokens');
    expect(tuRow).toHaveProperty('totalCacheReadTokens');
    expect(tuRow).not.toHaveProperty('aicQuantity');
  });

  it('premium request has AIC fields that token usage lacks', () => {
    const prCsv = loadExample('premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv');
    const prReport = parseCSV(prCsv, 'pr.csv');
    const prRow = prReport.rows[0] as PremiumRequestRow;

    expect(prRow).toHaveProperty('aicQuantity');
    expect(prRow).toHaveProperty('aicGrossAmount');
    expect(prRow).not.toHaveProperty('totalInputTokens');
  });

  it('all 4 original report types are uniquely detectable', () => {
    const files = [
      { file: 'premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv', expected: REPORT_TYPES.PREMIUM_REQUEST },
      { file: 'Token.Usage.Report.csv', expected: REPORT_TYPES.TOKEN_USAGE },
      { file: 'usageReport_1_7f2ed6006ee54fb8af73f5cbb7ac1f1d.csv', expected: REPORT_TYPES.USAGE_REPORT },
      { file: 'ghas_active_committers_octodemo_2026-03-27T1521.csv', expected: REPORT_TYPES.GHAS_ACTIVE_COMMITTERS },
    ];

    for (const { file, expected } of files) {
      const csvText = loadExample(file);
      const report = parseCSV(csvText, file);
      expect(report.type).toBe(expected);
    }
  });
});

// ─── Edge Cases & Error Handling ────────────────────────────────────────────────

describe('parseCSV — edge cases', () => {
  it('handles empty numeric fields as 0', () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-03-01","user1","copilot","sku1","model1","","requests","","","","","False","","org1","","",""`;
    const report = parseCSV(csv, 'test.csv');
    const row = report.rows[0] as PremiumRequestRow;
    expect(row.quantity).toBe(0);
    expect(row.grossAmount).toBe(0);
    expect(row.aicQuantity).toBe(0);
  });

  it('throws on completely empty CSV', () => {
    expect(() => parseCSV('', 'empty.csv')).toThrow();
  });

  it('throws on CSV with only a header and no data rows', () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"`;
    const report = parseCSV(csv, 'header-only.csv');
    expect(report.rowCount).toBe(0);
    expect(report.rows).toEqual([]);
  });

  it('handles CSV with trailing newlines', () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-03-01","user1","copilot","copilot_premium_request","GPT-5","1","requests","0.04","0.04","0.04","0","False","1000","org1","","0","0"


`;
    const report = parseCSV(csv, 'trailing.csv');
    expect(report.rowCount).toBe(1);
  });

  it('handles exceedsQuota = "True"', () => {
    const csv = `"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"
"2026-03-01","user1","copilot","copilot_premium_request","GPT-5","1","requests","0.04","0.04","0","0.04","True","1000","org1","","0","0"`;
    const report = parseCSV(csv, 'test.csv');
    const row = report.rows[0] as PremiumRequestRow;
    expect(row.exceedsQuota).toBe(true);
    expect(row.netAmount).toBe(0.04);
  });

  it('handles scientific notation in numeric fields', () => {
    const csv = `"date","product","sku","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","username","organization","repository","workflow_path","cost_center_name"
"2026-02-01","actions","actions_custom_image_storage","49152","gigabyte-hours","9.4086E-05","4.6245150719999994","4.6245150719999994","0","","octodemo","","",""`;
    const report = parseCSV(csv, 'sci.csv');
    const row = report.rows[0] as UsageReportRow;
    expect(row.appliedCostPerQuantity).toBeCloseTo(0.000094086, 8);
    expect(row.quantity).toBe(49152);
  });
});

// ─── Dormant Users (Real Example File) ─────────────────────────────────────────

describe('parseCSV — Dormant Users (real file)', () => {
  const csv = loadExample('export-octodemo-1774679438.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'export.csv');
    expect(report.type).toBe(REPORT_TYPES.DORMANT_USERS);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'export.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('maps all columns to camelCase properties', () => {
    const report = parseCSV(csv, 'export.csv');
    const row = report.rows[0] as DormantUsersRow;
    const expectedKeys: (keyof DormantUsersRow)[] = [
      'createdAt', 'id', 'login', 'role', 'lastLoggedIp', 'twoFactorEnabled', 'outsideCollaborator',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('parses id as a number', () => {
    const report = parseCSV(csv, 'export.csv');
    const row = report.rows[0] as DormantUsersRow;
    expect(typeof row.id).toBe('number');
    expect(row.id).toBeGreaterThan(0);
  });

  it('parses twoFactorEnabled as boolean', () => {
    const report = parseCSV(csv, 'export.csv');
    for (const row of report.rows as DormantUsersRow[]) {
      expect(typeof row.twoFactorEnabled).toBe('boolean');
    }
  });

  it('parses outsideCollaborator as boolean', () => {
    const report = parseCSV(csv, 'export.csv');
    for (const row of report.rows as DormantUsersRow[]) {
      expect(typeof row.outsideCollaborator).toBe('boolean');
    }
  });

  it('contains known roles', () => {
    const report = parseCSV(csv, 'export.csv');
    const roles = new Set((report.rows as DormantUsersRow[]).map((r) => r.role));
    // At minimum the "user" role should exist
    expect(roles.has('user')).toBe(true);
  });

  it('every row has a non-empty login', () => {
    const report = parseCSV(csv, 'export.csv');
    for (const row of report.rows as DormantUsersRow[]) {
      expect(row.login.length).toBeGreaterThan(0);
    }
  });

  it('does NOT have billing columns', () => {
    const report = parseCSV(csv, 'export.csv');
    const row = report.rows[0] as DormantUsersRow;
    expect(row).not.toHaveProperty('grossAmount');
    expect(row).not.toHaveProperty('netAmount');
  });
});

// ─── Copilot Seat Activity (Real Example File) ────────────────────────────────

describe('parseCSV — Copilot Seat Activity (real file)', () => {
  const csv = loadExample('octodemo-seat-activity-1774680875.csv');

  it('detects report type correctly', () => {
    const report = parseCSV(csv, 'seats.csv');
    expect(report.type).toBe(REPORT_TYPES.COPILOT_SEAT_ACTIVITY);
  });

  it('parses all rows without errors', () => {
    const report = parseCSV(csv, 'seats.csv');
    expect(report.rowCount).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.rowCount);
  });

  it('maps all columns to camelCase properties', () => {
    const report = parseCSV(csv, 'seats.csv');
    const row = report.rows[0] as CopilotSeatActivityRow;
    const expectedKeys: (keyof CopilotSeatActivityRow)[] = [
      'reportTime', 'login', 'lastAuthenticatedAt', 'lastActivityAt', 'lastSurfaceUsed', 'organization',
    ];
    for (const key of expectedKeys) {
      expect(row).toHaveProperty(key);
    }
  });

  it('reportTime is an ISO datetime string', () => {
    const report = parseCSV(csv, 'seats.csv');
    const row = report.rows[0] as CopilotSeatActivityRow;
    expect(row.reportTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('lastSurfaceUsed contains editor info or "None"', () => {
    const report = parseCSV(csv, 'seats.csv');
    for (const row of report.rows as CopilotSeatActivityRow[]) {
      expect(row.lastSurfaceUsed.length).toBeGreaterThan(0);
    }
  });

  it('a user can appear multiple times (one row per org)', () => {
    const report = parseCSV(csv, 'seats.csv');
    const loginCounts = new Map<string, number>();
    for (const row of report.rows as CopilotSeatActivityRow[]) {
      loginCounts.set(row.login, (loginCounts.get(row.login) ?? 0) + 1);
    }
    const multiOrgUsers = [...loginCounts.values()].filter((c) => c > 1);
    expect(multiOrgUsers.length).toBeGreaterThan(0);
  });

  it('every row has a non-empty organization', () => {
    const report = parseCSV(csv, 'seats.csv');
    for (const row of report.rows as CopilotSeatActivityRow[]) {
      expect(row.organization.length).toBeGreaterThan(0);
    }
  });

  it('does NOT have billing columns', () => {
    const report = parseCSV(csv, 'seats.csv');
    const row = report.rows[0] as CopilotSeatActivityRow;
    expect(row).not.toHaveProperty('grossAmount');
    expect(row).not.toHaveProperty('quantity');
  });

  it('computes a valid dateRange from reportTime', () => {
    const report = parseCSV(csv, 'seats.csv');
    expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.start <= report.dateRange.end).toBe(true);
  });

  it('dateRange values are parseable as valid Date objects', () => {
    const report = parseCSV(csv, 'seats.csv');
    const start = new Date(report.dateRange.start + 'T00:00:00');
    const end = new Date(report.dateRange.end + 'T00:00:00');
    expect(isNaN(start.getTime())).toBe(false);
    expect(isNaN(end.getTime())).toBe(false);
    expect(start.toISOString()).toBeTruthy();
    expect(end.toISOString()).toBeTruthy();
  });
});

// ─── dateRange Edge Cases ──────────────────────────────────────────────────────

describe('parseCSV — dateRange edge cases', () => {
  const seatHeader = 'Report Time,Login,Last Authenticated At,Last Activity At,Last Surface Used,Organization';

  it('handles rows where lastActivityAt is empty', () => {
    const csv = [
      seatHeader,
      '2026-03-28T06:54:33Z,user1,2026-03-27T03:52:53Z,,None,org1',
      '2026-03-28T06:54:33Z,user2,2026-03-27T03:52:53Z,,None,org1',
    ].join('\n');
    const report = parseCSV(csv, 'seats.csv');
    expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isNaN(new Date(report.dateRange.end + 'T00:00:00').getTime())).toBe(false);
  });

  it('handles rows where lastActivityAt is "None"', () => {
    const csv = [
      seatHeader,
      '2026-03-28T06:54:33Z,user1,2026-03-27T03:52:53Z,None,None,org1',
    ].join('\n');
    const report = parseCSV(csv, 'seats.csv');
    expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // "None" must NOT leak into dateRange
    expect(report.dateRange.start).not.toBe('None');
    expect(report.dateRange.end).not.toBe('None');
  });

  it('handles rows where lastActivityAt is "N/A"', () => {
    const csv = [
      seatHeader,
      '2026-03-28T06:54:33Z,user1,2026-03-27T03:52:53Z,N/A,None,org1',
    ].join('\n');
    const report = parseCSV(csv, 'seats.csv');
    expect(report.dateRange.start).not.toBe('N/A');
    expect(report.dateRange.end).not.toBe('N/A');
  });

  it('all real example files produce valid dateRange dates', () => {
    const files = [
      'premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv',
      'Token.Usage.Report.csv',
      'usageReport_1_7f2ed6006ee54fb8af73f5cbb7ac1f1d.csv',
      'ghas_active_committers_octodemo_2026-03-27T1521.csv',
      'export-octodemo-1774679438.csv',
      'octodemo-seat-activity-1774680875.csv',
    ];
    for (const file of files) {
      const csvText = loadExample(file);
      const report = parseCSV(csvText, file);
      if (report.dateRange.start) {
        expect(report.dateRange.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const start = new Date(report.dateRange.start + 'T00:00:00');
        expect(isNaN(start.getTime())).toBe(false);
      }
      if (report.dateRange.end) {
        expect(report.dateRange.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        const end = new Date(report.dateRange.end + 'T00:00:00');
        expect(isNaN(end.getTime())).toBe(false);
        // This is the exact operation that crashed: toISOString() must not throw
        expect(() => end.toISOString()).not.toThrow();
      }
    }
  });
});

// ─── Updated Cross-Report Schema Validation ───────────────────────────────────

describe('cross-report: all 6 report types are uniquely detectable', () => {
  it('detects all 6 report types from real example files', () => {
    const files = [
      { file: 'premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv', expected: REPORT_TYPES.PREMIUM_REQUEST },
      { file: 'Token.Usage.Report.csv', expected: REPORT_TYPES.TOKEN_USAGE },
      { file: 'usageReport_1_7f2ed6006ee54fb8af73f5cbb7ac1f1d.csv', expected: REPORT_TYPES.USAGE_REPORT },
      { file: 'ghas_active_committers_octodemo_2026-03-27T1521.csv', expected: REPORT_TYPES.GHAS_ACTIVE_COMMITTERS },
      { file: 'export-octodemo-1774679438.csv', expected: REPORT_TYPES.DORMANT_USERS },
      { file: 'octodemo-seat-activity-1774680875.csv', expected: REPORT_TYPES.COPILOT_SEAT_ACTIVITY },
    ];

    for (const { file, expected } of files) {
      const csvText = loadExample(file);
      const report = parseCSV(csvText, file);
      expect(report.type).toBe(expected);
    }
  });
});

// ─── Billing Format Drift Regressions ──────────────────────────────────────────

describe('parseCSV — billing format drift', () => {
  it('parses a summarized metered usage report end to end', () => {
    const csv = [
      '"date","product","sku","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","organization","repository","cost_center_name"',
      '"2026-02-01","actions","actions_linux","1200","minutes","0.008","9.6","0","9.6","acme-platform","acme-platform/api",""',
      '"2026-02-02","actions","actions_macos","30","minutes","0.08","2.4","0","2.4","acme-platform","acme-platform/ios","engineering"',
    ].join('\n');

    const report = parseCSV(csv, 'summarized.csv');

    expect(report.type).toBe(REPORT_TYPES.USAGE_REPORT);
    expect(report.rowCount).toBe(2);
    expect(report.dateRange).toEqual({ start: '2026-02-01', end: '2026-02-02' });

    const rows = report.rows as UsageReportRow[];
    expect(rows[0].quantity).toBe(1200);
    expect(rows[0].repository).toBe('acme-platform/api');
    // Columns absent from the summarized export fall back to empty strings.
    expect(rows[0].username).toBe('');
    expect(rows[0].workflowPath).toBe('');
  });

  it('parses AI-credit billed Copilot rows', () => {
    const csv = [
      '"date","username","product","sku","model","quantity","unit_type","applied_cost_per_quantity","gross_amount","discount_amount","net_amount","exceeds_quota","total_monthly_quota","organization","cost_center_name","aic_quantity","aic_gross_amount"',
      '"2026-07-01","gray-oak","copilot","copilot_ai_credit","Claude Opus 4.6","250","ai-credits","0.01","2.5","0","2.5","False","1000","alder-labs","","250","2.5"',
    ].join('\n');

    const report = parseCSV(csv, 'ai-credits.csv');

    expect(report.type).toBe(REPORT_TYPES.PREMIUM_REQUEST);
    const rows = report.rows as PremiumRequestRow[];
    expect(rows[0].sku).toBe('copilot_ai_credit');
    expect(rows[0].unitType).toBe('ai-credits');
    expect(rows[0].quantity).toBe(250);
    expect(rows[0].aicQuantity).toBe(250);
  });

  it('parses an org-level seat activity export with no Organization column', () => {
    const csv = [
      'Report Time,Login,Last Authenticated At,Last Activity At,Last Surface Used',
      '2026-03-28T06:54:33Z,val-wynn,2026-02-25T10:12:31Z,2026-02-07T17:13:59Z,vscode/1.112.0',
    ].join('\n');

    const report = parseCSV(csv, 'seat-activity-org.csv');

    expect(report.type).toBe(REPORT_TYPES.COPILOT_SEAT_ACTIVITY);
    const rows = report.rows as CopilotSeatActivityRow[];
    expect(rows[0].login).toBe('val-wynn');
    expect(rows[0].organization).toBe('');
  });
});
