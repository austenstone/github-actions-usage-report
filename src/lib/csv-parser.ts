import Papa from 'papaparse';
import type {
  PremiumRequestRow,
  TokenUsageRow,
  UsageReportRow,
  GhasActiveCommittersRow,
  DormantUsersRow,
  CopilotSeatActivityRow,
  EnterpriseMemberRow,
  ParsedReport,
  ReportType,
  CopilotProduct,
  PremiumRequestSku,
  UsageProduct,
  UsageUnitType,
} from './types';
import { REPORT_TYPES } from './types';

/**
 * CSV header signatures → report type. Evaluated in array order, most specific
 * first, because several reports share the billing column prefix.
 *
 * Signatures list only columns that are structurally guaranteed for that report.
 * The metered usage report ships in two flavours — detailed (31 days, includes
 * `username` and `workflow_path`) and summarized (up to a year, omits both) — so
 * it keys off `repository`, which no Copilot report has.
 */
const HEADER_SIGNATURES: ReadonlyArray<readonly [ReportType, readonly string[]]> = [
  [REPORT_TYPES.TOKEN_USAGE, ['total_input_tokens', 'total_output_tokens']],
  [REPORT_TYPES.PREMIUM_REQUEST, ['model', 'exceeds_quota', 'total_monthly_quota']],
  [REPORT_TYPES.USAGE_REPORT, ['date', 'product', 'sku', 'net_amount', 'repository']],
  [REPORT_TYPES.GHAS_ACTIVE_COMMITTERS, ['user login', 'organization / repository', 'last pushed date']],
  [REPORT_TYPES.COPILOT_SEAT_ACTIVITY, ['report time', 'last authenticated at', 'last activity at', 'last surface used']],
  [REPORT_TYPES.ENTERPRISE_MEMBERS, ['github com login', 'license type', 'github com enterprise roles', 'total user accounts']],
  [REPORT_TYPES.DORMANT_USERS, ['login', 'role', '2fa_enabled?', 'outside_collaborator']],
];

/** Detect report type from CSV headers */
export function detectReportType(headers: string[]): ReportType {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [type, signatures] of HEADER_SIGNATURES) {
    if (signatures.every((sig) => lowerHeaders.includes(sig))) {
      return type;
    }
  }

  throw new Error(`Unknown report type. Headers: ${headers.join(', ')}`);
}

/** Parse a boolean value from CSV string */
function parseBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

/** Parse a number, defaulting to 0 for empty/invalid values */
function parseNum(value: string | undefined): number {
  if (!value || value.trim() === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

/** Map raw CSV row to PremiumRequestRow */
function mapPremiumRequestRow(raw: Record<string, string>): PremiumRequestRow {
  return {
    date: raw['date'] ?? '',
    username: raw['username'] ?? '',
    product: (raw['product'] ?? '') as CopilotProduct,
    sku: (raw['sku'] ?? '') as PremiumRequestSku,
    model: raw['model'] ?? '',
    quantity: parseNum(raw['quantity']),
    unitType: (raw['unit_type'] ?? '') as 'requests' | 'ai-units' | 'ai-credits',
    appliedCostPerQuantity: parseNum(raw['applied_cost_per_quantity']),
    grossAmount: parseNum(raw['gross_amount']),
    discountAmount: parseNum(raw['discount_amount']),
    netAmount: parseNum(raw['net_amount']),
    exceedsQuota: parseBool(raw['exceeds_quota'] ?? 'false'),
    totalMonthlyQuota: parseNum(raw['total_monthly_quota']),
    organization: raw['organization'] ?? '',
    costCenterName: raw['cost_center_name'] ?? '',
    aicQuantity: parseNum(raw['aic_quantity']),
    aicGrossAmount: parseNum(raw['aic_gross_amount']),
  };
}

/** Map raw CSV row to TokenUsageRow */
function mapTokenUsageRow(raw: Record<string, string>): TokenUsageRow {
  return {
    date: raw['date'] ?? '',
    username: raw['username'] ?? '',
    product: (raw['product'] ?? '') as CopilotProduct,
    sku: (raw['sku'] ?? '') as PremiumRequestSku,
    model: raw['model'] ?? '',
    quantity: parseNum(raw['quantity']),
    unitType: (raw['unit_type'] ?? '') as 'requests' | 'ai-units' | 'ai-credits',
    appliedCostPerQuantity: parseNum(raw['applied_cost_per_quantity']),
    grossAmount: parseNum(raw['gross_amount']),
    discountAmount: parseNum(raw['discount_amount']),
    netAmount: parseNum(raw['net_amount']),
    exceedsQuota: parseBool(raw['exceeds_quota'] ?? 'false'),
    totalMonthlyQuota: parseNum(raw['total_monthly_quota']),
    organization: raw['organization'] ?? '',
    costCenterName: raw['cost_center_name'] ?? '',
    totalInputTokens: parseNum(raw['total_input_tokens']),
    totalOutputTokens: parseNum(raw['total_output_tokens']),
    totalCacheCreationTokens: parseNum(raw['total_cache_creation_tokens']),
    totalCacheReadTokens: parseNum(raw['total_cache_read_tokens']),
  };
}

/** Map raw CSV row to UsageReportRow */
function mapUsageReportRow(raw: Record<string, string>): UsageReportRow {
  return {
    date: raw['date'] ?? '',
    product: (raw['product'] ?? '') as UsageProduct,
    sku: raw['sku'] ?? '',
    quantity: parseNum(raw['quantity']),
    unitType: (raw['unit_type'] ?? '') as UsageUnitType,
    appliedCostPerQuantity: parseNum(raw['applied_cost_per_quantity']),
    grossAmount: parseNum(raw['gross_amount']),
    discountAmount: parseNum(raw['discount_amount']),
    netAmount: parseNum(raw['net_amount']),
    username: raw['username'] ?? '',
    organization: raw['organization'] ?? '',
    repository: raw['repository'] ?? '',
    workflowPath: raw['workflow_path'] ?? '',
    costCenterName: raw['cost_center_name'] ?? '',
  };
}

/** Map raw CSV row to GhasActiveCommittersRow */
function mapGhasRow(raw: Record<string, string>): GhasActiveCommittersRow {
  const orgRepo = raw['organization / repository'] ?? '';
  const slashIdx = orgRepo.indexOf('/');
  return {
    userLogin: raw['user login'] ?? '',
    organization: slashIdx >= 0 ? orgRepo.slice(0, slashIdx) : orgRepo,
    repository: slashIdx >= 0 ? orgRepo.slice(slashIdx + 1) : '',
    lastPushedDate: raw['last pushed date'] ?? '',
    lastPushedEmail: raw['last pushed email'] ?? '',
  };
}

/** Map raw CSV row to DormantUsersRow */
function mapDormantUsersRow(raw: Record<string, string>): DormantUsersRow {
  return {
    createdAt: raw['created_at'] ?? '',
    id: parseNum(raw['id']),
    login: raw['login'] ?? '',
    role: raw['role'] ?? '',
    lastLoggedIp: raw['last_logged_ip'] ?? '',
    twoFactorEnabled: parseBool(raw['2fa_enabled?'] ?? 'false'),
    outsideCollaborator: parseBool(raw['outside_collaborator'] ?? 'false'),
  };
}

/** Map raw CSV row to CopilotSeatActivityRow */
function mapCopilotSeatActivityRow(raw: Record<string, string>): CopilotSeatActivityRow {
  return {
    reportTime: raw['report time'] ?? '',
    login: raw['login'] ?? '',
    lastAuthenticatedAt: raw['last authenticated at'] ?? '',
    lastActivityAt: raw['last activity at'] ?? '',
    lastSurfaceUsed: raw['last surface used'] ?? '',
    organization: raw['organization'] ?? '',
  };
}

/** Map raw CSV row to EnterpriseMemberRow */
function mapEnterpriseMemberRow(raw: Record<string, string>): EnterpriseMemberRow {
  return {
    login: raw['github com login'] ?? '',
    name: raw['github com name'] ?? '',
    githubComUser: parseBool(raw['github com user'] ?? 'false'),
    enterpriseServerUser: parseBool(raw['enterprise server user'] ?? 'false'),
    visualStudioSubscriptionUser: parseBool(raw['visual studio subscription user'] ?? 'false'),
    licenseType: raw['license type'] ?? '',
    profileUrl: raw['github com profile'] ?? '',
    memberRoles: raw['github com member roles'] ?? '',
    enterpriseRoles: raw['github com enterprise roles'] ?? '',
    twoFactorAuth: parseBool(raw['github com two factor auth'] ?? 'false'),
    advancedSecurityUser: parseBool(raw['github com advanced security license user'] ?? 'false'),
    vsLicenseStatus: raw['visual studio license status'] ?? '',
    totalUserAccounts: parseNum(raw['total user accounts']),
  };
}

/** Parse CSV text into a typed report */
export function parseCSV(csvText: string, fileName: string): ParsedReport {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0]?.message ?? 'Unknown error'}`);
  }

  const headers = result.meta.fields ?? [];
  const type = detectReportType(headers);

  let rows: PremiumRequestRow[] | TokenUsageRow[] | UsageReportRow[] | GhasActiveCommittersRow[] | DormantUsersRow[] | CopilotSeatActivityRow[] | EnterpriseMemberRow[];

  switch (type) {
    case REPORT_TYPES.PREMIUM_REQUEST:
      rows = result.data.map(mapPremiumRequestRow);
      break;
    case REPORT_TYPES.TOKEN_USAGE:
      rows = result.data.map(mapTokenUsageRow);
      break;
    case REPORT_TYPES.USAGE_REPORT:
      rows = result.data.map(mapUsageReportRow);
      break;
    case REPORT_TYPES.GHAS_ACTIVE_COMMITTERS:
      rows = result.data.map(mapGhasRow);
      break;
    case REPORT_TYPES.DORMANT_USERS:
      rows = result.data.map(mapDormantUsersRow);
      break;
    case REPORT_TYPES.COPILOT_SEAT_ACTIVITY:
      rows = result.data.map(mapCopilotSeatActivityRow);
      break;
    case REPORT_TYPES.ENTERPRISE_MEMBERS:
      rows = result.data.map(mapEnterpriseMemberRow);
      break;
  }

  const dates = rows
    .map((r) => {
      if ('date' in r) return r.date as string;
      if ('lastPushedDate' in r) return r.lastPushedDate;
      if ('reportTime' in r) return (r.reportTime as string).slice(0, 10);
      if ('lastActivityAt' in r) return (r.lastActivityAt as string).slice(0, 10);
      if ('createdAt' in r) return (r.createdAt as string).slice(0, 10);
      return '';
    })
    .filter((d) => d && /^\d{4}-\d{2}-\d{2}/.test(d))
    .sort();
  const dateRange = {
    start: dates[0] ?? '',
    end: dates[dates.length - 1] ?? '',
  };

  return {
    type,
    rows,
    fileName,
    rowCount: rows.length,
    dateRange,
  };
}
