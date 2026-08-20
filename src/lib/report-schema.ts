import type { ComponentType } from 'react';
import type { ParsedReport, ReportType } from './types';
import { REPORT_TYPES } from './types';
import {
  CopilotIcon,
  CpuIcon,
  FileIcon,
  GraphIcon,
  ShieldLockIcon,
  PeopleIcon,
  PersonIcon,
  OrganizationIcon,
} from '@primer/octicons-react';

// Metric option displayed in TimeSeriesChart metric toggle
export interface MetricOption {
  key: string;
  label: string;
  isCurrency: boolean;
  /** When key differs from the actual row field (e.g. key='seats' but data lives in 'quantity') */
  valueField?: string;
  /** Optional row filter applied before aggregation (e.g. filter to seat-only rows) */
  rowFilter?: (row: Record<string, unknown>) => boolean;
}

// Hero card configuration — drives what cards render per report type
export interface HeroCardConfig {
  id: string;
  title: string;
  /** Field to sum for the main value. Special values: 'totalTokens', 'totalMinutes', 'totalStorageGBH' are computed in HeroCardsGrid. */
  valueField: string;
  /** 'currency' | 'compact' | 'number' */
  format: 'currency' | 'compact' | 'number';
  /** Field to topN for the breakdown below the value */
  breakdownGroupField?: string;
  /** Field to sum for each breakdown entry */
  breakdownMetricField?: string;
  /** Static breakdown entries (e.g., discount line) */
  staticBreakdown?: Array<{ label: string; valueField: string; format: 'currency' | 'compact'; prefix?: string }>;
  /** Only show this card when report.type matches */
  onlyForType?: ReportType;
}

// Full schema that drives all report-type-aware rendering
export interface ReportSchema {
  type: ReportType;
  label: string;
  pluralLabel: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  description: string;
  emptyStateTitle: string;
  emptyStateText: string;
  /** Primary dimension for breakdown stacking (model for copilot, sku for usage) */
  primaryDimension: string;
  /** Default groupBy column */
  defaultGroupBy: string;
  /** Metric options for TimeSeriesChart toggle */
  metricOptions: MetricOption[];
  /** Field to stack bars by in breakdown/cost charts */
  breakdownStackField: string;
  /** Sankey hierarchy levels */
  sankeyHierarchy: string[];
  /** Hero card configurations */
  heroCards: HeroCardConfig[];
  /** Filterable fields for FilterBar */
  filterableFields: string[];
}

// ─── Schema Definitions ────────────────────────────────────────────────────────

const COPILOT_METRIC_OPTIONS: MetricOption[] = [
  { key: 'grossAmount', label: 'Spend', isCurrency: true },
  { key: 'totalInputTokens', label: 'Input Tokens', isCurrency: false },
  { key: 'totalOutputTokens', label: 'Output Tokens', isCurrency: false },
  { key: 'totalCacheCreationTokens', label: 'Cache Creation', isCurrency: false },
  { key: 'totalCacheReadTokens', label: 'Cache Reads', isCurrency: false },
];

const COPILOT_HERO_CARDS: HeroCardConfig[] = [
  {
    id: 'gross',
    title: 'Gross amount',
    valueField: 'totalGrossAmount',
    format: 'currency',
    breakdownGroupField: 'model',
    breakdownMetricField: 'grossAmount',
  },
  {
    id: 'net',
    title: 'Net amount',
    valueField: 'totalNetAmount',
    format: 'currency',
    staticBreakdown: [{ label: 'Discount', valueField: 'totalDiscountAmount', format: 'currency', prefix: '−' }],
  },
  {
    id: 'requests',
    title: 'Total requests',
    valueField: 'totalQuantity',
    format: 'compact',
    breakdownGroupField: 'username',
    breakdownMetricField: 'quantity',
  },
  {
    id: 'tokens',
    title: 'Total tokens',
    valueField: 'totalTokens',
    format: 'compact',
    onlyForType: REPORT_TYPES.TOKEN_USAGE,
  },
];

const COPILOT_FILTERABLE_FIELDS = [
  'username', 'model', 'organization', 'sku', 'costCenterName', 'product',
];

const PREMIUM_REQUEST_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.PREMIUM_REQUEST,
  label: 'Premium Requests',
  pluralLabel: 'Premium Request Reports',
  icon: CopilotIcon,
  description: 'Token-Based Billing Report Explorer',
  emptyStateTitle: 'Copilot Usage Viewer',
  emptyStateText: 'Upload a GitHub billing CSV to visualize Copilot spend, premium requests, and token usage.',
  primaryDimension: 'model',
  defaultGroupBy: 'username',
  metricOptions: [COPILOT_METRIC_OPTIONS[0]], // spend only for premium requests
  breakdownStackField: 'model',
  sankeyHierarchy: ['organization', 'username', 'model'],
  heroCards: COPILOT_HERO_CARDS.filter((c) => c.id !== 'tokens'),
  filterableFields: COPILOT_FILTERABLE_FIELDS,
};

const TOKEN_USAGE_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.TOKEN_USAGE,
  label: 'Token Usage',
  pluralLabel: 'Token Usage Reports',
  icon: CpuIcon,
  description: 'Token-Based Billing Report Explorer',
  emptyStateTitle: 'Copilot Usage Viewer',
  emptyStateText: 'Upload a GitHub billing CSV to visualize Copilot spend, premium requests, and token usage.',
  primaryDimension: 'model',
  defaultGroupBy: 'username',
  metricOptions: COPILOT_METRIC_OPTIONS,
  breakdownStackField: 'model',
  sankeyHierarchy: ['organization', 'username', 'model'],
  heroCards: COPILOT_HERO_CARDS,
  filterableFields: COPILOT_FILTERABLE_FIELDS,
};

const USAGE_REPORT_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.USAGE_REPORT,
  label: 'Usage Report',
  pluralLabel: 'Metered Usage Reports',
  icon: GraphIcon,
  description: 'GitHub Actions, Packages, LFS & Copilot Seats',
  emptyStateTitle: 'Metered Usage Viewer',
  emptyStateText: 'Upload a GitHub metered usage CSV to visualize Actions minutes, storage, and product spend.',
  primaryDimension: 'sku',
  defaultGroupBy: 'sku',
  metricOptions: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'Quantity', isCurrency: false },
  ],
  breakdownStackField: 'sku',
  sankeyHierarchy: ['organization', 'repository', 'sku'],
  heroCards: [
    {
      id: 'gross',
      title: 'Gross amount',
      valueField: 'totalGrossAmount',
      format: 'currency',
      breakdownGroupField: 'sku',
      breakdownMetricField: 'grossAmount',
    },
    {
      id: 'net',
      title: 'Net amount',
      valueField: 'totalNetAmount',
      format: 'currency',
      staticBreakdown: [{ label: 'Discount', valueField: 'totalDiscountAmount', format: 'currency', prefix: '−' }],
    },
    {
      id: 'minutes',
      title: 'Total minutes',
      valueField: 'totalMinutes',
      format: 'compact',
    },
    {
      id: 'storage',
      title: 'Storage (GB·h)',
      valueField: 'totalStorageGBH',
      format: 'compact',
    },
  ],
  filterableFields: [
    'username', 'product', 'sku', 'organization', 'repository', 'workflowPath', 'costCenterName',
  ],
};

const GHAS_ACTIVE_COMMITTERS_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.GHAS_ACTIVE_COMMITTERS,
  label: 'GHAS Committers',
  pluralLabel: 'GHAS Active Committer Reports',
  icon: ShieldLockIcon,
  description: 'GitHub Advanced Security active committer usage',
  emptyStateTitle: 'GHAS Active Committers',
  emptyStateText: 'Upload a GHAS active committers CSV to see which users are consuming Advanced Security licenses.',
  primaryDimension: 'userLogin',
  defaultGroupBy: 'userLogin',
  metricOptions: [
    { key: '_count', label: 'Repos', isCurrency: false },
  ],
  breakdownStackField: 'repository',
  sankeyHierarchy: ['organization', 'userLogin', 'repository'],
  heroCards: [
    {
      id: 'committers',
      title: 'Active committers',
      valueField: 'uniqueUsers',
      format: 'number',
    },
    {
      id: 'repos',
      title: 'Repositories',
      valueField: 'uniqueRepositories',
      format: 'number',
    },
  ],
  filterableFields: ['userLogin', 'organization', 'repository'],
};

const DORMANT_USERS_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.DORMANT_USERS,
  label: 'Dormant Users',
  pluralLabel: 'Dormant Users Reports',
  icon: PeopleIcon,
  description: 'Organization dormant users and security posture',
  emptyStateTitle: 'Dormant Users Viewer',
  emptyStateText: 'Upload a GitHub dormant users CSV to audit roles, 2FA status, and outside collaborators.',
  primaryDimension: 'role',
  defaultGroupBy: 'role',
  metricOptions: [
    { key: '_count', label: 'Members', isCurrency: false },
  ],
  breakdownStackField: 'role',
  sankeyHierarchy: ['role', 'login'],
  heroCards: [
    {
      id: 'total',
      title: 'Total members',
      valueField: 'totalMembers',
      format: 'number',
    },
    {
      id: '2fa',
      title: '2FA enabled',
      valueField: 'twoFactorCount',
      format: 'number',
    },
  ],
  filterableFields: ['login', 'role', 'twoFactorEnabled', 'outsideCollaborator'],
};

const COPILOT_SEAT_ACTIVITY_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.COPILOT_SEAT_ACTIVITY,
  label: 'Seat Activity',
  pluralLabel: 'Copilot Seat Activity Reports',
  icon: PersonIcon,
  description: 'Copilot seat assignment and activity tracking',
  emptyStateTitle: 'Copilot Seat Activity',
  emptyStateText: 'Upload a Copilot seat activity CSV to track seat utilization, last activity, and editor adoption.',
  primaryDimension: 'login',
  defaultGroupBy: 'organization',
  metricOptions: [
    { key: '_count', label: 'Seats', isCurrency: false },
  ],
  breakdownStackField: 'lastSurfaceUsed',
  sankeyHierarchy: ['organization', 'login', 'lastSurfaceUsed'],
  heroCards: [
    {
      id: 'seats',
      title: 'Total seats',
      valueField: 'totalSeats',
      format: 'number',
    },
    {
      id: 'active',
      title: 'Active seats',
      valueField: 'activeSeats',
      format: 'number',
    },
  ],
  filterableFields: ['login', 'lastSurfaceUsed', 'organization'],
};

const ENTERPRISE_MEMBERS_SCHEMA: ReportSchema = {
  type: REPORT_TYPES.ENTERPRISE_MEMBERS,
  label: 'Enterprise Members',
  pluralLabel: 'Enterprise Membership Reports',
  icon: OrganizationIcon,
  description: 'Enterprise licensing and membership overview',
  emptyStateTitle: 'Enterprise Members',
  emptyStateText: 'Upload an enterprise membership CSV to review licenses, roles, 2FA status, and Visual Studio subscriptions.',
  primaryDimension: 'licenseType',
  defaultGroupBy: 'licenseType',
  metricOptions: [
    { key: '_count', label: 'Members', isCurrency: false },
  ],
  breakdownStackField: 'licenseType',
  sankeyHierarchy: ['licenseType', 'enterpriseRoles', 'login'],
  heroCards: [
    {
      id: 'total',
      title: 'Total licenses',
      valueField: 'totalLicenses',
      format: 'number',
    },
    {
      id: 'ghas',
      title: 'GHAS licensed',
      valueField: 'ghasLicenseCount',
      format: 'number',
    },
  ],
  filterableFields: ['login', 'licenseType', 'enterpriseRoles', 'twoFactorAuth', 'advancedSecurityUser'],
};

// ─── Schema Registry ───────────────────────────────────────────────────────────

const SCHEMA_REGISTRY: Record<string, ReportSchema> = {
  [REPORT_TYPES.PREMIUM_REQUEST]: PREMIUM_REQUEST_SCHEMA,
  [REPORT_TYPES.TOKEN_USAGE]: TOKEN_USAGE_SCHEMA,
  [REPORT_TYPES.USAGE_REPORT]: USAGE_REPORT_SCHEMA,
  [REPORT_TYPES.GHAS_ACTIVE_COMMITTERS]: GHAS_ACTIVE_COMMITTERS_SCHEMA,
  [REPORT_TYPES.DORMANT_USERS]: DORMANT_USERS_SCHEMA,
  [REPORT_TYPES.COPILOT_SEAT_ACTIVITY]: COPILOT_SEAT_ACTIVITY_SCHEMA,
  [REPORT_TYPES.ENTERPRISE_MEMBERS]: ENTERPRISE_MEMBERS_SCHEMA,
};

/** Get the schema for a report type. Falls back to premium request for unknown types. */
export function getReportSchema(type: ReportType | string): ReportSchema {
  return SCHEMA_REGISTRY[type] ?? PREMIUM_REQUEST_SCHEMA;
}

/** All available schemas (for sidebar nav generation) */
export function getAllSchemas(): ReportSchema[] {
  return Object.values(SCHEMA_REGISTRY);
}

const GROUP_BY_SAMPLE_SIZE = 200;

/**
 * Pick a group-by column that the report actually has data for.
 *
 * Reports of the same type don't always carry the same columns — the
 * summarized metered usage export drops `username` and `workflow_path`, and
 * org-level seat activity has no `organization`. Keeping a column that is
 * blank for every row renders an empty chart, so fall back to the schema
 * default. Rows are sampled with a stride rather than from the head, since
 * columns like `username` are legitimately blank for leading storage rows.
 */
export function resolveGroupByColumn(
  report: ParsedReport,
  currentColumn: string,
): string {
  const schema = getReportSchema(report.type);
  if (!currentColumn) return schema.defaultGroupBy;

  const rows = report.rows as Array<Record<string, unknown>>;
  const stride = Math.max(1, Math.floor(rows.length / GROUP_BY_SAMPLE_SIZE));
  for (let i = 0; i < rows.length; i += stride) {
    const value = rows[i]?.[currentColumn];
    if (value !== undefined && value !== null && value !== '') return currentColumn;
  }
  return schema.defaultGroupBy;
}

/** Sidebar nav page identifiers derived from report types */
export const PAGE_TYPES = {
  COPILOT: 'copilot',
  USAGE: 'usage',
  GHAS: 'ghas',
  MEMBERS: 'members',
  SEAT_ACTIVITY: 'seat-activity',
  ENTERPRISE_MEMBERS: 'enterprise-members',
  FILES: 'files',
} as const;

export type PageType = (typeof PAGE_TYPES)[keyof typeof PAGE_TYPES];

/** Map page type to matching report types */
export const PAGE_REPORT_TYPES: Partial<Record<PageType, ReportType[]>> = {
  [PAGE_TYPES.COPILOT]: [REPORT_TYPES.PREMIUM_REQUEST, REPORT_TYPES.TOKEN_USAGE],
  [PAGE_TYPES.USAGE]: [REPORT_TYPES.USAGE_REPORT],
  [PAGE_TYPES.GHAS]: [REPORT_TYPES.GHAS_ACTIVE_COMMITTERS],
  [PAGE_TYPES.MEMBERS]: [REPORT_TYPES.DORMANT_USERS],
  [PAGE_TYPES.SEAT_ACTIVITY]: [REPORT_TYPES.COPILOT_SEAT_ACTIVITY],
  [PAGE_TYPES.ENTERPRISE_MEMBERS]: [REPORT_TYPES.ENTERPRISE_MEMBERS],
};

/** Sidebar nav configuration */
export interface NavPageConfig {
  id: PageType;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
}

export const NAV_PAGES: NavPageConfig[] = [
  { id: PAGE_TYPES.USAGE, label: 'Metered usage', icon: GraphIcon },
  { id: PAGE_TYPES.COPILOT, label: 'Copilot usage', icon: CopilotIcon },
  { id: PAGE_TYPES.GHAS, label: 'GHAS committers', icon: ShieldLockIcon },
  { id: PAGE_TYPES.SEAT_ACTIVITY, label: 'Seat activity', icon: PersonIcon },
  { id: PAGE_TYPES.MEMBERS, label: 'Dormant users', icon: PeopleIcon },
  { id: PAGE_TYPES.ENTERPRISE_MEMBERS, label: 'Enterprise members', icon: OrganizationIcon },
];

export const UTILITY_NAV_PAGES: NavPageConfig[] = [
  { id: PAGE_TYPES.FILES, label: 'Manage files', icon: FileIcon },
];

/** Infer the page type from a report type */
export function pageTypeForReport(reportType: ReportType): PageType {
  for (const [page, types] of Object.entries(PAGE_REPORT_TYPES)) {
    if (types.includes(reportType)) return page as PageType;
  }
  return PAGE_TYPES.COPILOT;
}

// ─── Product-Specific Metric Options ───────────────────────────────────────────

/** Per-product metric options for the usage report. When a product filter is active,
 *  charts use these instead of the generic schema metricOptions. */
export const PRODUCT_METRIC_OPTIONS: Record<string, MetricOption[]> = {
  actions: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'Minutes', isCurrency: false },
  ],
  actions_storage: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'GB-Hours', isCurrency: false },
  ],
  copilot: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'seats', label: 'Seats', isCurrency: false, valueField: 'quantity', rowFilter: (r) => r.unitType === 'user-months' },
    // Anything not billed per seat is consumption. Matching on "not user-months"
    // rather than an allow-list keeps this working across the PRU → AI credits
    // billing change, which introduced new unit types (ai-units, ai-credits).
    { key: 'usage', label: 'Usage', isCurrency: false, valueField: 'quantity', rowFilter: (r) => r.unitType !== 'user-months' },
  ],
  spark: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'Requests', isCurrency: false },
  ],
  git_lfs: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'Storage (GB)', isCurrency: false },
  ],
  packages: [
    { key: 'grossAmount', label: 'Spend', isCurrency: true },
    { key: 'quantity', label: 'Storage (GB)', isCurrency: false },
  ],
};

/** Spend-only metrics (used when "All" products are shown or product not recognized) */
export const MIXED_METRIC_OPTIONS: MetricOption[] = [
  { key: 'grossAmount', label: 'Spend', isCurrency: true },
];
