import { describe, it, expect } from 'vitest';
import {
  getReportSchema,
  pageTypeForReport,
  PAGE_TYPES,
  PAGE_REPORT_TYPES,
  PRODUCT_METRIC_OPTIONS,
  resolveGroupByColumn,
} from './report-schema';
import { REPORT_TYPES } from './types';

// These tests verify the schema registry and page routing work correctly.
// If a new report type is added without a schema, or a page→report mapping
// is wrong, these catch it.

describe('schema registry completeness', () => {
  it('every REPORT_TYPE has a matching schema', () => {
    for (const type of Object.values(REPORT_TYPES)) {
      const schema = getReportSchema(type);
      expect(schema.type).toBe(type);
    }
  });

  it('every schema has filterable fields that exist in real data', () => {
    // Known columns across report types
    const knownColumns = new Set([
      'username', 'model', 'organization', 'sku', 'costCenterName', 'product',
      'repository', 'workflowPath', 'unitType', 'userLogin', 'login', 'role',
      'lastSurfaceUsed', 'exceedsQuota', 'twoFactorEnabled', 'outsideCollaborator',
      'licenseType', 'githubComUser', 'enterpriseServerUser', 'enterpriseRoles',
      'twoFactorAuth', 'advancedSecurityUser',
    ]);

    for (const type of Object.values(REPORT_TYPES)) {
      const schema = getReportSchema(type);
      for (const field of schema.filterableFields) {
        expect(knownColumns).toContain(field);
      }
    }
  });
});

describe('page → report type mapping', () => {
  it('copilot page handles both premium_request and token_usage', () => {
    expect(pageTypeForReport(REPORT_TYPES.PREMIUM_REQUEST)).toBe(PAGE_TYPES.COPILOT);
    expect(pageTypeForReport(REPORT_TYPES.TOKEN_USAGE)).toBe(PAGE_TYPES.COPILOT);
  });

  it('every report type maps to a valid page', () => {
    const validPages = new Set(Object.values(PAGE_TYPES));
    for (const type of Object.values(REPORT_TYPES)) {
      const page = pageTypeForReport(type);
      expect(validPages).toContain(page);
    }
  });

  it('PAGE_REPORT_TYPES is inverse of pageTypeForReport', () => {
    for (const [page, reportTypes] of Object.entries(PAGE_REPORT_TYPES)) {
      for (const rt of reportTypes!) {
        expect(pageTypeForReport(rt)).toBe(page);
      }
    }
  });
});

describe('product metric options', () => {
  it('copilot product has a seat filter that checks unitType', () => {
    const copilot = PRODUCT_METRIC_OPTIONS['copilot'];
    const seatMetric = copilot.find(o => o.key === 'seats');
    expect(seatMetric).toBeTruthy();
    // The filter should match user-months (seat rows) but not requests
    expect(seatMetric!.rowFilter!({ unitType: 'user-months' })).toBe(true);
    expect(seatMetric!.rowFilter!({ unitType: 'requests' })).toBe(false);
  });

  it('actions product has minutes metric', () => {
    const actions = PRODUCT_METRIC_OPTIONS['actions'];
    expect(actions.some(o => o.label === 'Minutes')).toBe(true);
  });
});

describe('resolveGroupByColumn', () => {
  const report = (type: string, rows: Array<Record<string, unknown>>) =>
    ({ type, rows, fileName: 'f.csv', rowCount: rows.length, dateRange: { start: '', end: '' } }) as never;

  it('keeps the current column when the report has data for it', () => {
    const r = report(REPORT_TYPES.USAGE_REPORT, [{ username: 'ana-reyes', sku: 'actions_linux' }]);
    expect(resolveGroupByColumn(r, 'username')).toBe('username');
  });

  it('falls back to the schema default when the column is blank for every row', () => {
    const rows = Array.from({ length: 50 }, () => ({ username: '', sku: 'actions_linux' }));
    expect(resolveGroupByColumn(report(REPORT_TYPES.USAGE_REPORT, rows), 'username')).toBe('sku');
  });

  it('falls back when the column is missing entirely, as in summarized exports', () => {
    const rows = Array.from({ length: 50 }, () => ({ sku: 'actions_linux' }));
    expect(resolveGroupByColumn(report(REPORT_TYPES.USAGE_REPORT, rows), 'username')).toBe('sku');
  });

  it('keeps a column that is blank early but populated later', () => {
    const rows = Array.from({ length: 500 }, (_, i) => ({ username: i < 400 ? '' : 'kai-nakamura' }));
    expect(resolveGroupByColumn(report(REPORT_TYPES.USAGE_REPORT, rows), 'username')).toBe('username');
  });

  it('uses the schema default when there is no current column', () => {
    expect(resolveGroupByColumn(report(REPORT_TYPES.ENTERPRISE_MEMBERS, []), '')).toBe('licenseType');
  });

  it('falls back for an empty report rather than keeping an unusable column', () => {
    expect(resolveGroupByColumn(report(REPORT_TYPES.DORMANT_USERS, []), 'username')).toBe('role');
  });
});
