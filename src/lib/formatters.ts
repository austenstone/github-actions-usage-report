import type { ComponentType } from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getModelIconUrl } from './chart-theme';
import { AiModelIcon, ContainerIcon, CopilotIcon, DatabaseIcon, FileIcon, PackageIcon, PlayIcon, SparkleIcon, TagIcon } from '@primer/octicons-react';

type OcticonComponent = ComponentType<{ size?: number; className?: string; fill?: string }>;

/** Render an Octicon component to an HTML string for use in Highcharts legends */
function renderIcon(Icon: OcticonComponent, color?: string): string {
  const html = renderToStaticMarkup(createElement(Icon, { size: 16 }));
  if (color) return html.replace(/fill="[^"]*"/, `fill="${color}"`);
  return html;
}

/** Get an inline SVG string for a SKU (for Highcharts legend/tooltip HTML) */
export function getSkuIconSvg(rawValue: string, color?: string): string {
  const icon = getSkuIcon(rawValue);
  if (icon === TagIcon) return '';
  return renderIcon(icon, color);
}

/** Map a raw product key to the relevant Octicon */
export function getProductIcon(rawValue: string): OcticonComponent {
  const v = rawValue.toLowerCase();
  if (v === 'actions') return PlayIcon;
  if (v === 'copilot') return CopilotIcon;
  if (v === 'spark') return SparkleIcon;
  if (v === 'git_lfs') return FileIcon;
  if (v === 'packages') return PackageIcon;
  return TagIcon;
}

/** Get an inline SVG string for a product (for Highcharts legend/tooltip HTML) */
export function getProductIconSvg(rawValue: string, color?: string): string {
  const icon = getProductIcon(rawValue);
  if (icon === TagIcon) return '';
  return renderIcon(icon, color);
}

const AVATAR_COLUMNS = new Set(['username', 'organization', 'login', 'userLogin']);

/** Columns that have dedicated icon functions */
export function getGroupIconSvg(rawValue: string, column: string, color?: string): string {
  if (column === 'sku') return getSkuIconSvg(rawValue, color);
  if (column === 'product') return getProductIconSvg(rawValue, color);
  if (column === 'model' && rawValue) {
    return `<img src="${getModelIconUrl(rawValue)}" width="16" height="16" style="border-radius:50%;flex-shrink:0;" loading="lazy" />`;
  }
  if (AVATAR_COLUMNS.has(column) && rawValue) {
    return `<img src="${getAvatarUrl(rawValue, 32)}" width="16" height="16" style="border-radius:50%;flex-shrink:0;" loading="lazy" />`;
  }
  return '';
}

/** Check if a column has custom icon/avatar treatment */
export function columnHasIcons(column: string): boolean {
  return column === 'sku' || column === 'product' || column === 'model' || AVATAR_COLUMNS.has(column);
}

/** Get the React icon component for a group value (SKU/product only, not avatars) */
export function getGroupIcon(rawValue: string, column: string): OcticonComponent | null {
  if (column === 'sku') { const i = getSkuIcon(rawValue); return i === TagIcon ? null : i; }
  if (column === 'product') { const i = getProductIcon(rawValue); return i === TagIcon ? null : i; }
  return null;
}

/** Map a raw SKU key to the product-relevant Octicon */
export function getSkuIcon(rawValue: string): OcticonComponent {
  const v = rawValue.toLowerCase();
  if (v.includes('custom_image')) return ContainerIcon;
  if (v.includes('storage') && v.startsWith('actions')) return DatabaseIcon;
  if (v.startsWith('actions')) return PlayIcon;
  if (v.includes('premium_request') || v.includes('ai_unit')) return AiModelIcon;
  if (v.startsWith('copilot') || v.startsWith('coding_agent') || v.startsWith('spark')) return CopilotIcon;
  if (v.startsWith('packages')) return PackageIcon;
  if (v.startsWith('git_lfs')) return FileIcon;
  return TagIcon;
}

/** Format a number as USD currency */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a number with abbreviation (K, M, B) */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  if (value !== 0 && Math.abs(value) < 1) return value.toPrecision(2);
  return value.toFixed(0);
}

/** Format a number with commas */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/** Format a date string (YYYY-MM-DD) to a human-readable format */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.length === 7) {
    // YYYY-MM (monthly bucket)
    const [year, month] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format an ISO datetime string (e.g. 2026-03-28T06:54:33Z) to a compact display */
export function formatDatetime(value: string): string {
  if (!value || value === 'None') return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Format a date range */
export function formatDateRange(start: string, end: string): string {
  if (!start || !end) return '';
  if (start === end) return formatDate(start);
  return `${formatDate(start)} — ${formatDate(end)}`;
}

/**
 * Format an array of time bucket keys (YYYY-MM-DD or YYYY-MM) into display labels.
 * Uses compact numeric format: "3/5" for daily, "Mar" for monthly.
 * Includes year only when data spans multiple years.
 */
export function formatBucketLabels(keys: string[]): string[] {
  if (keys.length === 0) return [];

  const years = new Set(keys.map((k) => k.slice(0, 4)));
  const sameYear = years.size === 1;

  return keys.map((key) => {
    if (!key) return '';

    if (key.length === 7) {
      // Monthly: YYYY-MM
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1);
      return sameYear
        ? d.toLocaleDateString('en-US', { month: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Daily/weekly: YYYY-MM-DD → "3/5" or "3/5/26"
    const [year, month, day] = key.split('-').map(Number);
    return sameYear
      ? `${month}/${day}`
      : `${month}/${day}/${String(year).slice(2)}`;
  });
}

/** Convert a bucket key (YYYY-MM-DD or YYYY-MM) to a UTC timestamp for Highcharts datetime axes */
export function bucketKeyToTimestamp(key: string): number {
  if (key.length === 7) {
    const [y, m] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, 1);
  }
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Compact date range for tab labels — e.g. "Mar 2026" or "Feb–Mar 2026" */
export function formatDateRangeCompact(start: string, end: string): string {
  if (!start || !end) return '';
  const [sY, sM] = start.split('-').map(Number);
  const [eY, eM] = end.split('-').map(Number);
  const fmt = (y: number, m: number) =>
    new Date(y, m - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  if (sY === eY && sM === eM) return fmt(sY, sM);
  if (sY === eY) {
    const sMonth = new Date(sY, sM - 1).toLocaleDateString('en-US', { month: 'short' });
    return `${sMonth}–${fmt(eY, eM)}`;
  }
  return `${fmt(sY, sM)}–${fmt(eY, eM)}`;
}

/** Human-readable display names for raw SKU codes (Actions prefix stripped since icon provides context) */
const SKU_DISPLAY_NAMES: Record<string, string> = {
  copilot_premium_request: 'Copilot PRUs',
  coding_agent_premium_request: 'Coding Agent PRUs',
  spark_premium_request: 'Spark PRUs',
  copilot_ai_unit: 'Copilot AI Credits',
  coding_agent_ai_unit: 'Coding Agent AI Credits',
  spark_ai_unit: 'Spark AI Credits',
  copilot_enterprise: 'Copilot Enterprise',
  copilot_for_business: 'Copilot Business',
  actions_linux: 'Linux',
  actions_linux_4_core: 'Linux 4-core',
  actions_linux_8_core: 'Linux 8-core',
  actions_linux_16_core: 'Linux 16-core',
  actions_linux_32_core: 'Linux 32-core',
  actions_linux_64_core: 'Linux 64-core',
  actions_linux_arm: 'Linux ARM',
  actions_linux_slim: 'Linux Slim',
  actions_windows: 'Windows',
  actions_macos: 'macOS',
  actions_self_hosted_linux: 'Self-Hosted Linux',
  actions_self_hosted_windows: 'Self-Hosted Windows',
  actions_custom_image_storage: 'Custom Image Storage',
  actions_storage: 'Storage',
  git_lfs_bandwidth: 'Git LFS Bandwidth',
  git_lfs_storage: 'Git LFS Storage',
  packages_bandwidth: 'Packages Bandwidth',
  packages_storage: 'Packages Storage',
};

/** Human-readable display names for raw product codes */
const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  copilot: 'Copilot',
  spark: 'Spark',
  actions: 'Actions',
  git_lfs: 'Git LFS',
  packages: 'Packages',
};

/**
 * Format a raw grouping value (sku, product, etc.) into a human-readable label.
 * Falls through to the raw value when no mapping exists (e.g. usernames, model names).
 */
export function formatDisplayValue(value: string, column?: string): string {
  if (!value) return value;
  // Boolean-style field display
  if (value === 'true') return 'Yes';
  if (value === 'false') return 'No';
  if (column === 'sku') return SKU_DISPLAY_NAMES[value] ?? value;
  if (column === 'product') return PRODUCT_DISPLAY_NAMES[value] ?? value;
  if (column === 'workflowPath') return formatWorkflowPath(value);
  // For unknown columns, check both maps as a best-effort fallback
  return SKU_DISPLAY_NAMES[value] ?? PRODUCT_DISPLAY_NAMES[value] ?? value;
}

/** Humanize a column name (camelCase → Title Case) */
export function humanizeColumn(column: string): string {
  const MAP: Record<string, string> = {
    username: 'User',
    model: 'Model',
    organization: 'Organization',
    sku: 'SKU',
    costCenterName: 'Cost Center',
    product: 'Product',
    repository: 'Repository',
    grossAmount: 'Gross Amount',
    netAmount: 'Net Amount',
    discountAmount: 'Discount',
    quantity: 'Quantity',
    aicQuantity: 'AI Credits',
    aicGrossAmount: 'AI Credit Cost',
    totalInputTokens: 'Input Tokens',
    totalOutputTokens: 'Output Tokens',
    totalCacheCreationTokens: 'Cache Creation',
    totalCacheReadTokens: 'Cache Reads',
    unitType: 'Unit Type',
    exceedsQuota: 'Exceeds Quota',
    totalMonthlyQuota: 'Monthly Quota',
    workflowPath: 'Workflow',
    appliedCostPerQuantity: 'Unit Cost',
    date: 'Date',
    // GHAS
    userLogin: 'User',
    lastPushedDate: 'Last Pushed',
    lastPushedEmail: 'Email',
    // Dormant users
    login: 'Login',
    role: 'Role',
    createdAt: 'Created',
    memberId: 'ID',
    lastLoggedIp: 'Last IP',
    twoFactorEnabled: '2FA',
    outsideCollaborator: 'Outside Collab',
    // Seat activity
    reportTime: 'Report Time',
    lastAuthenticatedAt: 'Last Authenticated',
    lastActivityAt: 'Last Activity',
    lastSurfaceUsed: 'Surface',
  };
  return MAP[column] ?? column.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

/** Check if a username is a bot (ends with [bot]) */
export function isBot(username: string): boolean {
  return username.endsWith('[bot]');
}

/** Runtime cache of resolved bot avatar URLs (seeded with known bots, filled by API) */
const botAvatarCache = new Map<string, string>([
  // GitHub native bots
  ['dependabot[bot]', 'https://avatars.githubusercontent.com/in/29110?v=4'],
  ['github-actions[bot]', 'https://avatars.githubusercontent.com/in/65916?v=4'],
  ['github-advanced-security[bot]', 'https://avatars.githubusercontent.com/in/37929?v=4'],
  ['github-pages[bot]', 'https://avatars.githubusercontent.com/in/23105?v=4'],
  ['stale[bot]', 'https://avatars.githubusercontent.com/in/1724?v=4'],
  // AI coding agents
  ['copilot-swe-agent[bot]', 'https://avatars.githubusercontent.com/in/198982?v=4'],
  ['copilot-workspace[bot]', 'https://avatars.githubusercontent.com/in/406526?v=4'],
  ['anthropic-code-agent[bot]', 'https://avatars.githubusercontent.com/in/2246796?v=4'],
  ['devin-ai-integration[bot]', 'https://avatars.githubusercontent.com/in/878771?v=4'],
  ['coderabbitai[bot]', 'https://avatars.githubusercontent.com/in/480007?v=4'],
  // CI/CD & deployment
  ['vercel[bot]', 'https://avatars.githubusercontent.com/in/8546?v=4'],
  ['netlify[bot]', 'https://avatars.githubusercontent.com/in/13473?v=4'],
  ['azure-pipelines[bot]', 'https://avatars.githubusercontent.com/in/36174?v=4'],
  ['percy[bot]', 'https://avatars.githubusercontent.com/in/6400?v=4'],
  // Code quality & security
  ['codecov[bot]', 'https://avatars.githubusercontent.com/in/254?v=4'],
  ['sonarcloud[bot]', 'https://avatars.githubusercontent.com/in/12168?v=4'],
  ['socket-security[bot]', 'https://avatars.githubusercontent.com/in/206747?v=4'],
  ['sentry-io[bot]', 'https://avatars.githubusercontent.com/in/4141?v=4'],
  ['deepsource-autofix[bot]', 'https://avatars.githubusercontent.com/in/57168?v=4'],
  ['pre-commit-ci[bot]', 'https://avatars.githubusercontent.com/in/68672?v=4'],
  ['allstar-app[bot]', 'https://avatars.githubusercontent.com/in/119816?v=4'],
  // Dependency management
  ['renovate[bot]', 'https://avatars.githubusercontent.com/in/29139?v=4'],
  ['mend-bolt-for-github[bot]', 'https://avatars.githubusercontent.com/in/16809?v=4'],
  ['depfu[bot]', 'https://avatars.githubusercontent.com/in/7046?v=4'],
  // PR & workflow automation
  ['mergify[bot]', 'https://avatars.githubusercontent.com/in/10562?v=4'],
  ['kodiakhq[bot]', 'https://avatars.githubusercontent.com/in/29196?v=4'],
  ['imgbot[bot]', 'https://avatars.githubusercontent.com/in/4706?v=4'],
  ['changeset-bot[bot]', 'https://avatars.githubusercontent.com/in/43218?v=4'],
  ['linear[bot]', 'https://avatars.githubusercontent.com/in/60376?v=4'],
  ['graphite-app[bot]', 'https://avatars.githubusercontent.com/in/168040?v=4'],
  ['gitpod-io[bot]', 'https://avatars.githubusercontent.com/in/23396?v=4'],
  ['trunk-io[bot]', 'https://avatars.githubusercontent.com/in/174498?v=4'],
]);

// Hydrate runtime cache from localStorage (persisted API lookups survive reloads)
const AVATAR_STORAGE_KEY = 'tbb:bot-avatars';
try {
  const stored = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) ?? '{}') as Record<string, string>;
  for (const [k, v] of Object.entries(stored)) {
    if (!botAvatarCache.has(k)) botAvatarCache.set(k, v);
  }
} catch { /* noop */ }

/** Persist API-resolved avatars to localStorage */
function persistAvatarCache(): void {
  try {
    // Only persist entries not in the hardcoded list (those are already in code)
    const extras: Record<string, string> = {};
    const stored = JSON.parse(localStorage.getItem(AVATAR_STORAGE_KEY) ?? '{}') as Record<string, string>;
    for (const [k, v] of botAvatarCache.entries()) {
      // Keep anything that was either previously stored or resolved at runtime
      if (stored[k] || !HARDCODED_BOTS.has(k)) {
        extras[k] = v;
      }
    }
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(extras));
  } catch { /* storage full or unavailable */ }
}

/** Set of hardcoded bot names (skip persisting these) */
const HARDCODED_BOTS = new Set(botAvatarCache.keys());

/** In-flight fetch promises to avoid duplicate API calls */
const pendingFetches = new Map<string, Promise<string | null>>();

// Usernames the API had no avatar for. Kept in memory only, never persisted, so
// a reload retries a bot that has since been created or renamed. Without this
// every failed lookup repeats on each dataset change and exhausts the 60/hr
// unauthenticated rate limit, after which no avatars resolve at all.
const unresolvedAvatars = new Set<string>();

/** Simple throttle: max concurrent GitHub API requests */
const MAX_CONCURRENT_FETCHES = 3;
let activeFetchCount = 0;
const fetchQueue: Array<() => void> = [];

function runNextFetch(): void {
  if (fetchQueue.length > 0 && activeFetchCount < MAX_CONCURRENT_FETCHES) {
    activeFetchCount++;
    const next = fetchQueue.shift()!;
    next();
  }
}

function throttledFetch(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const execute = () => {
      fetch(url)
        .then(resolve, reject)
        .finally(() => {
          activeFetchCount--;
          runNextFetch();
        });
    };

    if (activeFetchCount < MAX_CONCURRENT_FETCHES) {
      activeFetchCount++;
      execute();
    } else {
      fetchQueue.push(execute);
    }
  });
}

/**
 * Resolve a bot's avatar URL from the GitHub API and cache it.
 * Returns the avatar_url or null if the lookup fails.
 */
export async function resolveBotAvatar(username: string): Promise<string | null> {
  if (botAvatarCache.has(username)) return botAvatarCache.get(username)!;
  if (unresolvedAvatars.has(username)) return null;
  if (!isBot(username)) return null;

  // Deduplicate in-flight requests
  const existing = pendingFetches.get(username);
  if (existing) return existing;

  const promise = throttledFetch(`https://api.github.com/users/${encodeURIComponent(username)}`)
    .then((res) => {
      if (!res.ok) return null;
      return res.json() as Promise<{ avatar_url?: string }>;
    })
    .then((data) => {
      const url = data?.avatar_url ?? null;
      if (url) {
        botAvatarCache.set(username, url);
        persistAvatarCache();
      } else {
        unresolvedAvatars.add(username);
      }
      return url;
    })
    .catch(() => {
      unresolvedAvatars.add(username);
      return null;
    })
    .finally(() => pendingFetches.delete(username));

  pendingFetches.set(username, promise);
  return promise;
}

/**
 * Pre-warm the avatar cache for all bot usernames in a dataset.
 * Returns true if any new avatars were resolved (for triggering re-renders).
 * Caps at 10 API lookups per batch to avoid rate limits.
 */
export async function preloadBotAvatars(usernames: string[]): Promise<boolean> {
  const bots = usernames.filter(
    (u) => isBot(u) && !botAvatarCache.has(u) && !unresolvedAvatars.has(u),
  );
  if (bots.length === 0) return false;
  // Cap lookups to avoid hammering the API with many unknown bots
  const batch = bots.slice(0, 10);
  const results = await Promise.allSettled(batch.map(resolveBotAvatar));
  return results.some((r) => r.status === 'fulfilled' && r.value !== null);
}

/** Get the GitHub avatar URL for a username, handling bot accounts correctly.
 *  Returns cached bot URLs instantly; unknown bots get a best-effort URL. */
export function getAvatarUrl(username: string, size = 40): string {
  // Empty/missing usernames get the GitHub ghost (octocat silhouette)
  if (!username || username === '(empty)') {
    return `https://github.com/ghost.png?size=${size}`;
  }
  // Check the cache first (covers hardcoded + API-resolved bots)
  const cached = botAvatarCache.get(username);
  if (cached) {
    return cached + (cached.includes('?') ? `&s=${size}` : `?s=${size}`);
  }
  if (isBot(username)) {
    // Unknown bot not yet resolved: strip [bot] and try the .png shortcut
    const base = username.replace('[bot]', '');
    return `https://github.com/${encodeURIComponent(base)}.png?size=${size}`;
  }
  return `https://github.com/${encodeURIComponent(username)}.png?size=${size}`;
}

/**
 * Format a workflow path for display.
 * - `.github/workflows/ci.yml` → `ci.yml`
 * - `dynamic/dependabot/dependabot-updates` → `dependabot-updates`
 * - `required/123/.github/workflows/review.yml` → `review.yml`
 * Returns the full path unchanged if no pattern matches.
 */
export function formatWorkflowPath(path: string): string {
  if (!path) return '(empty)';

  // Standard: .github/workflows/name.yml
  const stdMatch = path.match(/\.github\/workflows\/([^/]+)$/);
  if (stdMatch) return stdMatch[1];

  // Dynamic: dynamic/service/name
  const dynMatch = path.match(/^dynamic\/[^/]+\/(.+)$/);
  if (dynMatch) return dynMatch[1];

  // Required: required/{id}/.github/workflows/name.yml
  const reqMatch = path.match(/^required\/[^/]+\/\.github\/workflows\/([^/]+)$/);
  if (reqMatch) return reqMatch[1];

  return path;
}

/** Classify a workflow path type for badge display */
export function classifyWorkflowPath(path: string): 'standard' | 'managed' | 'required' | null {
  if (!path) return null;
  if (path.startsWith('dynamic/')) return 'managed';
  if (path.startsWith('required/')) return 'required';
  if (path.includes('.github/workflows/')) return 'standard';
  return null;
}
