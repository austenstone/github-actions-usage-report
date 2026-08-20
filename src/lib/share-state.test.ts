import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearShareHash } from './share-state';

// These tests verify the share URL round-trip: compress → decompress → original data.
// If LZ-String or the payload format breaks, these catch it.

describe('share URL round-trip', () => {
  it('buildShareURL → readShareData preserves filter state and CSV data', async () => {
    const { buildShareURL, readShareData } = await import('./share-state');
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5174', pathname: '/github-actions-usage-report/' },
      writable: true,
    });

    const state = { groupBy: 'model', period: '2026-03', tab: 'table' };
    const csvs = [{ fileName: 'report.csv', content: 'date,amount\n2026-03-01,42.50\n2026-03-02,18.75' }];
    const url = await buildShareURL(state, csvs);

    expect(url).toBeTruthy();
    expect(url!.length).toBeLessThan(8000);

    // Decode the share hash
    const hash = url!.split('#')[1];
    Object.defineProperty(window, 'location', {
      value: { hash: `#${hash}` },
      writable: true,
    });

    const payload = await readShareData();
    expect(payload).toBeTruthy();
    expect(payload!.s.groupBy).toBe('model');
    expect(payload!.s.period).toBe('2026-03');
    expect(payload!.s.tab).toBe('table');
    expect(payload!.c[0].data).toBe('date,amount\n2026-03-01,42.50\n2026-03-02,18.75');
  });

  it('returns null for oversized payloads', async () => {
    const { buildShareURL } = await import('./share-state');
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:5174', pathname: '/github-actions-usage-report/' },
      writable: true,
    });

    const hugeCsv = 'col\n' + Array(50000).fill('a]long value that resists compression well xyz123').join('\n');
    const url = await buildShareURL({}, [{ fileName: 'huge.csv', content: hugeCsv }]);
    expect(url).toBeNull();
  });

  it('readShareData returns null when no share hash present', async () => {
    const { readShareData } = await import('./share-state');
    Object.defineProperty(window, 'location', { value: { hash: '' }, writable: true });
    expect(await readShareData()).toBeNull();
  });
});

describe('clearShareHash', () => {
  const replaceStateSpy = vi.fn();
  beforeEach(() => {
    replaceStateSpy.mockClear();
    window.history.replaceState = replaceStateSpy;
  });

  it('strips share hash and preserves search params', () => {
    Object.defineProperty(window, 'location', {
      value: { hash: '#data=xyz', pathname: '/github-actions-usage-report/', search: '?tab=table' },
      writable: true,
    });
    clearShareHash();
    expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '/github-actions-usage-report/?tab=table');
  });

  it('ignores non-share hashes', () => {
    Object.defineProperty(window, 'location', {
      value: { hash: '#section', pathname: '/github-actions-usage-report/', search: '' },
      writable: true,
    });
    clearShareHash();
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });
});
