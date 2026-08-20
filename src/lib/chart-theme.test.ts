import { afterEach, describe, it, expect } from 'vitest';
import {
  buildColorMap,
  buildGitHubChartTheme,
  getModelIconUrl,
  GITHUB_COLORS_RESOLVED,
} from './chart-theme';

describe('buildColorMap', () => {
  it('assigns distinct branded colors per AI model family', () => {
    const map = buildColorMap(['Claude Sonnet 4.5', 'GPT-5', 'Gemini 3 Pro']);
    const colors = [...map.values()];
    // Three different brands should produce three different colors
    expect(new Set(colors).size).toBe(3);
  });

  it('shades sibling models within same brand differently', () => {
    const map = buildColorMap(['Claude Sonnet 4.5', 'Claude Opus 4.6', 'Claude Haiku 4.5']);
    const colors = [...map.values()];
    expect(new Set(colors).size).toBe(3);
  });

  it('falls back to generic palette when branding disabled', () => {
    const map = buildColorMap(['Claude Sonnet 4.5', 'GPT-5'], false);
    expect(map.get('Claude Sonnet 4.5')).toBe(GITHUB_COLORS_RESOLVED[0]);
    expect(map.get('GPT-5')).toBe(GITHUB_COLORS_RESOLVED[1]);
  });

  it('wraps palette index for many non-branded series', () => {
    const names = Array.from({ length: 20 }, (_, i) => `Custom ${i}`);
    const map = buildColorMap(names);
    // 17 colors in palette, so index 17 should wrap to color 0
    expect(map.get('Custom 17')).toBe(GITHUB_COLORS_RESOLVED[0]);
  });

  it('handles empty input', () => {
    expect(buildColorMap([]).size).toBe(0);
  });
});

describe('getModelIconUrl', () => {
  it('returns provider-specific icon for each major model family', () => {
    expect(getModelIconUrl('Claude Sonnet 4.5')).toContain('anthropic');
    expect(getModelIconUrl('GPT-5')).toContain('data:image/svg+xml'); // OpenAI inline SVG
    expect(getModelIconUrl('Gemini 3 Pro')).toContain('googlegemini');
    expect(getModelIconUrl('Coding Agent model')).toContain('githubcopilot');
  });

  it('returns fallback for unknown models', () => {
    expect(getModelIconUrl('Unknown')).toContain('github');
  });

  it('is case insensitive', () => {
    expect(getModelIconUrl('CLAUDE')).toBe(getModelIconUrl('claude'));
  });
});

describe('buildGitHubChartTheme', () => {
  afterEach(() => {
    document.querySelector('[data-color-mode]')?.remove();
  });

  it('falls back to the bundled palette when no Primer root is mounted', () => {
    const theme = buildGitHubChartTheme() as { colors: string[] };

    expect(theme.colors).toEqual(GITHUB_COLORS_RESOLVED.slice(0, theme.colors.length));
  });

  it('reads live CSS variables from the Primer root when one exists', () => {
    const root = document.createElement('div');
    root.setAttribute('data-color-mode', 'dark');
    root.style.setProperty('--data-blue-color-emphasis', 'rgb(1, 2, 3)');
    document.body.appendChild(root);

    const theme = buildGitHubChartTheme() as { colors: string[] };

    expect(theme.colors[0]).toBe('rgb(1, 2, 3)');
  });

  it('disables credits, accessibility, and animation for deterministic rendering', () => {
    const theme = buildGitHubChartTheme() as {
      credits: { enabled: boolean };
      accessibility: { enabled: boolean };
      chart: { animation: boolean };
    };

    expect(theme.credits.enabled).toBe(false);
    expect(theme.accessibility.enabled).toBe(false);
    expect(theme.chart.animation).toBe(false);
  });
});
