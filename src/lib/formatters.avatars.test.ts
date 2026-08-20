import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const AVATAR_STORAGE_KEY = 'tbb:bot-avatars';

const okResponse = (avatarUrl: string) =>
  ({ ok: true, json: async () => ({ avatar_url: avatarUrl }) }) as unknown as Response;

/**
 * This jsdom setup exposes no localStorage, so the avatar cache's persistence
 * paths silently no-op under test. Install a minimal in-memory implementation
 * before importing the module so hydration and persistence are exercised.
 */
const memoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
};

let storage: Storage;

/**
 * The avatar cache is module-level state seeded from localStorage at import
 * time, so every test needs a fresh module registry to stay independent.
 */
const freshFormatters = async () => {
  vi.resetModules();
  return import('./formatters');
};

describe('bot avatar resolution', () => {
  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never calls the API for a human username', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('austenstone')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves known bots from the built-in list without a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('dependabot[bot]')).resolves.toContain(
      'avatars.githubusercontent.com',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves an unknown bot from the API and persists it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('https://example.test/a.png'));
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('acme-ci[bot]')).resolves.toBe('https://example.test/a.png');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/users/acme-ci%5Bbot%5D',
    );

    const stored = JSON.parse(storage.getItem(AVATAR_STORAGE_KEY) ?? '{}');
    expect(stored['acme-ci[bot]']).toBe('https://example.test/a.png');
  });

  it('rehydrates persisted avatars on the next load', async () => {
    storage.setItem(
      AVATAR_STORAGE_KEY,
      JSON.stringify({ 'acme-ci[bot]': 'https://example.test/cached.png' }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('acme-ci[bot]')).resolves.toBe(
      'https://example.test/cached.png',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the API rejects the lookup', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response));
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('missing[bot]')).resolves.toBeNull();
    expect(storage.getItem(AVATAR_STORAGE_KEY)).toBeNull();
  });

  it('returns null when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('offline[bot]')).resolves.toBeNull();
  });

  it('collapses concurrent lookups for the same bot into one request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('https://example.test/b.png'));
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    const results = await Promise.all([
      resolveBotAvatar('busy[bot]'),
      resolveBotAvatar('busy[bot]'),
      resolveBotAvatar('busy[bot]'),
    ]);

    expect(results).toEqual(Array(3).fill('https://example.test/b.png'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-request a bot the API had no avatar for', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('gone[bot]')).resolves.toBeNull();
    await expect(resolveBotAvatar('gone[bot]')).resolves.toBeNull();
    await expect(resolveBotAvatar('gone[bot]')).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not re-request a bot whose lookup threw', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    await expect(resolveBotAvatar('flaky[bot]')).resolves.toBeNull();
    await expect(resolveBotAvatar('flaky[bot]')).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('skips known-unresolvable bots on later preload passes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const { preloadBotAvatars } = await freshFormatters();

    await preloadBotAvatars(['a[bot]', 'b[bot]']);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await preloadBotAvatars(['a[bot]', 'b[bot]']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps failures out of storage so a reload retries them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response));
    const first = await freshFormatters();
    await first.resolveBotAvatar('later[bot]');
    expect(storage.getItem(AVATAR_STORAGE_KEY)).toBeNull();

    const fetchMock = vi.fn().mockResolvedValue(okResponse('https://example.test/late.png'));
    vi.stubGlobal('fetch', fetchMock);
    const second = await freshFormatters();

    await expect(second.resolveBotAvatar('later[bot]')).resolves.toBe(
      'https://example.test/late.png',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('queues requests beyond the concurrency cap but still resolves them all', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('https://example.test/c.png'));
    vi.stubGlobal('fetch', fetchMock);
    const { resolveBotAvatar } = await freshFormatters();

    const names = Array.from({ length: 8 }, (_, i) => `queued-${i}[bot]`);
    const results = await Promise.all(names.map(resolveBotAvatar));

    expect(results.every((r) => r === 'https://example.test/c.png')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});

describe('preloadBotAvatars', () => {
  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing when the dataset has no bots', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { preloadBotAvatars } = await freshFormatters();

    await expect(preloadBotAvatars(['austenstone', 'octocat'])).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips bots that are already cached', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { preloadBotAvatars } = await freshFormatters();

    await expect(preloadBotAvatars(['dependabot[bot]'])).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports true once at least one avatar resolves', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('https://example.test/d.png')));
    const { preloadBotAvatars } = await freshFormatters();

    await expect(preloadBotAvatars(['fresh-a[bot]', 'fresh-b[bot]'])).resolves.toBe(true);
  });

  it('reports false when every lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response));
    const { preloadBotAvatars } = await freshFormatters();

    await expect(preloadBotAvatars(['nope-a[bot]', 'nope-b[bot]'])).resolves.toBe(false);
  });

  it('caps a single batch at ten API lookups', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('https://example.test/e.png'));
    vi.stubGlobal('fetch', fetchMock);
    const { preloadBotAvatars } = await freshFormatters();

    const many = Array.from({ length: 25 }, (_, i) => `bulk-${i}[bot]`);
    await preloadBotAvatars(many);

    expect(fetchMock).toHaveBeenCalledTimes(10);
  });
});
