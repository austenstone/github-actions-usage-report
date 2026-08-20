// ─── Copilot Model Names ───────────────────────────────────────────────────────

/** Known Copilot model names (new models are added frequently, so allow string fallback) */
export type CopilotModel =
  // Claude
  | 'Claude Haiku 4.5'
  | 'Claude Sonnet 4'
  | 'Claude Sonnet 4.5'
  | 'Claude Sonnet 4.6'
  | 'Claude Opus 4.5'
  | 'Claude Opus 4.6'
  // GPT
  | 'GPT-4o'
  | 'GPT-4o mini'
  | 'GPT-4.1'
  | 'GPT-5'
  | 'GPT-5 mini'
  | 'GPT-5.1'
  | 'GPT-5.2'
  | 'GPT-5.4'
  // Codex
  | 'GPT-5.1-Codex-Max'
  | 'GPT-5.1-Codex-Mini'
  | 'GPT-5.2-Codex'
  | 'GPT-5.3-Codex'
  // Gemini
  | 'Gemini 2.5 Pro'
  | 'Gemini 3 Flash'
  | 'Gemini 3 Pro'
  | 'Gemini 3.1 Pro'
  // Special purpose
  | 'Code Review model'
  | 'Coding Agent model'
  // Catch-all for new models
  | (string & {});

/** Auto-routed model prefixed with "Auto: " */
export type AutoModel = `Auto: ${CopilotModel}`;

/** Any model value that can appear in a Copilot report */
export type CopilotModelValue = CopilotModel | AutoModel;

// ─── Copilot Product & SKU ─────────────────────────────────────────────────────

/** Products in Copilot reports */
export type CopilotProduct = 'copilot' | 'spark';

/** SKUs in the Premium Request report */
export type PremiumRequestSku =
  | 'copilot_premium_request'
  | 'coding_agent_premium_request'
  | 'spark_premium_request'
  | 'copilot_ai_unit'
  | 'coding_agent_ai_unit'
  | 'spark_ai_unit'
  | 'copilot_ai_credit'
  | 'coding_agent_ai_credit'
  | 'spark_ai_credit';

// ─── Usage Report Product & SKU ────────────────────────────────────────────────

/** All products in the general usage report */
export type UsageProduct = 'actions' | 'copilot' | 'spark' | 'git_lfs' | 'packages';

/** Actions runner SKUs */
export type ActionsRunnerSku =
  | 'actions_linux'
  | 'actions_linux_4_core'
  | 'actions_linux_8_core'
  | 'actions_linux_16_core'
  | 'actions_linux_32_core'
  | 'actions_linux_64_core'
  | 'actions_linux_arm'
  | 'actions_linux_slim'
  | 'actions_windows'
  | 'actions_macos'
  | 'actions_self_hosted_linux'
  | 'actions_self_hosted_windows';

/** Actions storage SKUs */
export type ActionsStorageSku = 'actions_storage' | 'actions_custom_image_storage';

/** Copilot seat SKUs (appear in general usage report, not Copilot-specific reports) */
export type CopilotSeatSku = 'copilot_enterprise' | 'copilot_for_business';

/** Git LFS SKUs */
export type GitLfsSku = 'git_lfs_storage' | 'git_lfs_bandwidth';

/** Packages SKUs */
export type PackagesSku = 'packages_storage' | 'packages_bandwidth';

/** All known SKUs in the general usage report */
export type UsageSku =
  | ActionsRunnerSku
  | ActionsStorageSku
  | CopilotSeatSku
  | PremiumRequestSku
  | GitLfsSku
  | PackagesSku
  | (string & {});

/** Unit types for metered usage */
export type UsageUnitType =
  | 'minutes'
  | 'gigabyte-hours'
  | 'gigabytes'
  | 'requests'
  | 'user-months'
  | 'ai-units'
  | 'ai-credits';

// ─── CSV Column Name Mappings (raw header → camelCase) ─────────────────────────

/** Raw CSV column headers for the Premium Request report */
export type PremiumRequestCsvHeader =
  | 'date'
  | 'username'
  | 'product'
  | 'sku'
  | 'model'
  | 'quantity'
  | 'unit_type'
  | 'applied_cost_per_quantity'
  | 'gross_amount'
  | 'discount_amount'
  | 'net_amount'
  | 'exceeds_quota'
  | 'total_monthly_quota'
  | 'organization'
  | 'cost_center_name'
  | 'aic_quantity'
  | 'aic_gross_amount';

/** Raw CSV column headers for the Token Usage report */
export type TokenUsageCsvHeader =
  | 'date'
  | 'username'
  | 'product'
  | 'sku'
  | 'model'
  | 'quantity'
  | 'unit_type'
  | 'applied_cost_per_quantity'
  | 'gross_amount'
  | 'discount_amount'
  | 'net_amount'
  | 'exceeds_quota'
  | 'total_monthly_quota'
  | 'organization'
  | 'cost_center_name'
  | 'total_input_tokens'
  | 'total_output_tokens'
  | 'total_cache_creation_tokens'
  | 'total_cache_read_tokens';

/** Raw CSV column headers for the general Usage report */
export type UsageReportCsvHeader =
  | 'date'
  | 'product'
  | 'sku'
  | 'quantity'
  | 'unit_type'
  | 'applied_cost_per_quantity'
  | 'gross_amount'
  | 'discount_amount'
  | 'net_amount'
  | 'username'
  | 'organization'
  | 'repository'
  | 'workflow_path'
  | 'cost_center_name';

/** Raw CSV column headers for the GHAS Active Committers report */
export type GhasActiveCommittersCsvHeader =
  | 'User login'
  | 'Organization / repository'
  | 'Last pushed date'
  | 'Last pushed email';

/** Raw CSV column headers for the Dormant Users report */
export type DormantUsersCsvHeader =
  | 'created_at'
  | 'id'
  | 'login'
  | 'role'
  | 'last_logged_ip'
  | '2fa_enabled?'
  | 'outside_collaborator';

/** Raw CSV column headers for the Copilot Seat Activity report */
export type CopilotSeatActivityCsvHeader =
  | 'Report Time'
  | 'Login'
  | 'Last Authenticated At'
  | 'Last Activity At'
  | 'Last Surface Used'
  | 'Organization';

// ─── Parsed Row Interfaces ─────────────────────────────────────────────────────

/** Shared columns across Premium Request and Token Usage reports */
interface BaseCopilotReportRow {  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** GitHub username */
  username: string;
  /** Product: "copilot" or "spark" (Copilot Workspace) */
  product: CopilotProduct;
  /** SKU identifier */
  sku: PremiumRequestSku;
  /** AI model used, may be prefixed with "Auto: " for auto-routed requests */
  model: CopilotModelValue;
  /** Number of premium requests or AI units consumed */
  quantity: number;
  /** "requests" for PRU billing, "ai-units"/"ai-credits" for AI credit billing */
  unitType: 'requests' | 'ai-units' | 'ai-credits';
  /** Cost per request (typically 0.04) */
  appliedCostPerQuantity: number;
  /** Total cost before discounts */
  grossAmount: number;
  /** Discount applied (equals grossAmount when fully covered by quota) */
  discountAmount: number;
  /** Amount billed after discounts */
  netAmount: number;
  /** Whether usage exceeded the monthly quota */
  exceedsQuota: boolean;
  /** Monthly premium request quota for the org (commonly 1000 or 300) */
  totalMonthlyQuota: number;
  /** GitHub organization name */
  organization: string;
  /** Cost center name (empty string when unassigned) */
  costCenterName: string;
}

/** Premium Request Usage Report row (legacy format with AI Credits columns) */
export interface PremiumRequestRow extends BaseCopilotReportRow {
  /** AI Credits quantity consumed */
  aicQuantity: number;
  /** AI Credits gross amount */
  aicGrossAmount: number;
}

/** Token Usage Report row (new format with token breakdown columns) */
export interface TokenUsageRow extends BaseCopilotReportRow {
  /** Total input/prompt tokens sent to the model */
  totalInputTokens: number;
  /** Total output/completion tokens generated by the model */
  totalOutputTokens: number;
  /** Total tokens used for cache creation (0 when provider doesn't support caching) */
  totalCacheCreationTokens: number;
  /** Total tokens read from cache (0 when provider doesn't support caching) */
  totalCacheReadTokens: number;
}

/** General Usage Report row (Actions, Copilot seats, LFS, Packages) */
export interface UsageReportRow {  /** ISO date string (YYYY-MM-DD), first of month */
  date: string;
  /** Product category */
  product: UsageProduct;
  /** SKU identifier (runner tier, storage type, seat type, etc.) */
  sku: UsageSku;
  /** Quantity consumed in the given unit type */
  quantity: number;
  /** Unit of measurement: minutes, gigabyte-hours, gigabytes, requests, user-months */
  unitType: UsageUnitType;
  /** Cost per unit (may use scientific notation in raw CSV, e.g. 9.4086E-05) */
  appliedCostPerQuantity: number;
  /** Total cost before discounts (subject to floating point noise) */
  grossAmount: number;
  /** Discount applied */
  discountAmount: number;
  /** Amount billed after discounts */
  netAmount: number;
  /** GitHub username (empty for org-level storage rows, may include [bot] suffix) */
  username: string;
  /** GitHub organization name */
  organization: string;
  /** Repository name (empty for org-level or storage rows) */
  repository: string;
  /** Workflow file path: .github/workflows/*.yml, dynamic/* (CodeQL, Dependabot), or required/* */
  workflowPath: string;
  /** Cost center name (empty string when unassigned) */
  costCenterName: string;
}

/** GHAS Active Committers report row */
export interface GhasActiveCommittersRow {
  /** GitHub username */
  userLogin: string;
  /** GitHub organization */
  organization: string;
  /** Repository name (without org prefix) */
  repository: string;
  /** ISO date string of last push */
  lastPushedDate: string;
  /** Email used for the push (noreply format: ID+username@users.noreply.github.com) */
  lastPushedEmail: string;
}

/** Dormant users report row (org member export with activity data) */
export interface DormantUsersRow {
  /** ISO datetime string when the member account was created */
  createdAt: string;
  /** GitHub user ID */
  id: number;
  /** GitHub username */
  login: string;
  /** Organization role: "user", "admin", or "billing_manager" */
  role: string;
  /** Last known IP address */
  lastLoggedIp: string;
  /** Whether the user has 2FA enabled */
  twoFactorEnabled: boolean;
  /** Whether the user is an outside collaborator (not a full org member) */
  outsideCollaborator: boolean;
}

/** Copilot seat activity report row */
export interface CopilotSeatActivityRow {
  /** ISO datetime string when the report was generated */
  reportTime: string;
  /** GitHub username */
  login: string;
  /** ISO datetime of last authentication, empty if never */
  lastAuthenticatedAt: string;
  /** ISO datetime of last Copilot activity, empty if never */
  lastActivityAt: string;
  /** Last editor/surface used (e.g. "vscode/1.112.0-insider/copilot-chat/0.40.2026031702") or "None" */
  lastSurfaceUsed: string;
  /** GitHub organization name */
  organization: string;
}

/** Enterprise membership (licensing) report row */
export interface EnterpriseMemberRow {
  /** GitHub.com username */
  login: string;
  /** Display name */
  name: string;
  /** Whether the user has a GitHub.com account */
  githubComUser: boolean;
  /** Whether the user has an Enterprise Server account */
  enterpriseServerUser: boolean;
  /** Whether the user has a Visual Studio subscription */
  visualStudioSubscriptionUser: boolean;
  /** License type: "Enterprise", "Visual Studio", etc. */
  licenseType: string;
  /** GitHub.com profile URL */
  profileUrl: string;
  /** Comma-separated org:role pairs (e.g. "octodemo:Owner, my-org:Member") */
  memberRoles: string;
  /** Enterprise-level roles (e.g. "Owner, Member") */
  enterpriseRoles: string;
  /** Whether 2FA is enabled */
  twoFactorAuth: boolean;
  /** Whether the user holds a GHAS license */
  advancedSecurityUser: boolean;
  /** Visual Studio license status */
  vsLicenseStatus: string;
  /** Total number of user accounts across all surfaces */
  totalUserAccounts: number;
}

// ─── Report Types ──────────────────────────────────────────────────────────────

export const REPORT_TYPES = {
  PREMIUM_REQUEST: 'premium_request',
  TOKEN_USAGE: 'token_usage',
  USAGE_REPORT: 'usage_report',
  GHAS_ACTIVE_COMMITTERS: 'ghas_active_committers',
  DORMANT_USERS: 'dormant_users',
  COPILOT_SEAT_ACTIVITY: 'copilot_seat_activity',
  ENTERPRISE_MEMBERS: 'enterprise_members',
} as const;

export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

export interface ParsedReport<T = PremiumRequestRow | TokenUsageRow | UsageReportRow | GhasActiveCommittersRow | DormantUsersRow | CopilotSeatActivityRow | EnterpriseMemberRow> {
  type: ReportType;
  rows: T[];
  fileName: string;
  rowCount: number;
  dateRange: { start: string; end: string };
  /** True when this report was loaded from built-in sample/demo data */
  isSample?: boolean;
}

/** Report rows that have billing fields (date, grossAmount, netAmount, etc.) */
export type BillingRow = PremiumRequestRow | TokenUsageRow | UsageReportRow;

export type AnyReportRow = BillingRow | GhasActiveCommittersRow | DormantUsersRow | CopilotSeatActivityRow | EnterpriseMemberRow;

/** Groupable columns vary by report type */
export const GROUPABLE_COLUMNS = {
  premium_request: ['username', 'model', 'organization', 'sku', 'costCenterName'] as const,
  token_usage: ['username', 'model', 'organization', 'sku', 'costCenterName'] as const,
  usage_report: [
    'username',
    'product',
    'sku',
    'organization',
    'repository',
    'workflowPath',
    'costCenterName',
  ] as const,
  ghas_active_committers: ['userLogin', 'organization', 'repository'] as const,
  dormant_users: ['login', 'role', 'twoFactorEnabled', 'outsideCollaborator'] as const,
  copilot_seat_activity: ['login', 'lastSurfaceUsed', 'organization'] as const,
  enterprise_members: ['login', 'licenseType', 'enterpriseRoles', 'twoFactorAuth', 'advancedSecurityUser'] as const,
} as const;

export type GroupableColumn<T extends ReportType> = (typeof GROUPABLE_COLUMNS)[T][number];

/** Time bucket options for aggregation */
export type TimeBucket = 'daily' | 'weekly' | 'monthly';

/** Summary metrics for KPI cards */
export interface ReportSummary {
  totalGrossAmount: number;
  totalNetAmount: number;
  totalDiscountAmount: number;
  totalQuantity: number;
  uniqueUsers: number;
  uniqueModels: number;
  uniqueOrganizations: number;
  dateRange: { start: string; end: string };
  // Usage report specific
  uniqueRepositories: number;
  uniqueProducts: number;
  totalMinutes: number;
  totalStorageGBH: number;
  totalTokens: number;
  // Flat report summaries
  totalMembers: number;
  twoFactorCount: number;
  totalSeats: number;
  activeSeats: number;
  // Enterprise members specific
  totalLicenses: number;
  ghasLicenseCount: number;
}
