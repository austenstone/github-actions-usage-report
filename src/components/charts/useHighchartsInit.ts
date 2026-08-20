import { useEffect } from 'react';

let initialized = false;
let themeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Apply the GitHub Highcharts theme using live CSS variable values.
 * @param updateExisting - When true, re-applies theme to already-mounted charts.
 *   Skipped on first init because `Highcharts.setOptions()` already covers
 *   charts created after the call. Only needed for live theme switches.
 */
async function initAndApplyTheme(updateExisting = false) {
  const [{ default: Highcharts }, { buildGitHubChartTheme }] = await Promise.all([
    import('highcharts'),
    import('../../lib/chart-theme'),
  ]);

  // Allow data: URIs in Highcharts HTML labels (AST sanitizer blocks them by default)
  if (!Highcharts.AST.allowedReferences.includes('data:')) {
    Highcharts.AST.allowedReferences.push('data:');
  }

  const theme = buildGitHubChartTheme();
  Highcharts.setOptions(theme);

  // Disable animations globally for snappy filter/page transitions
  Highcharts.setOptions({
    chart: { animation: false },
    plotOptions: { series: { animation: false } },
  });

  // Only re-apply to existing charts on theme change (not first init)
  if (updateExisting) {
     
    const { title: _t, subtitle: _s, series: _sr, ...safeTheme } = theme;
    Highcharts.charts.forEach((chart) => {
      if (chart) {
        chart.update(safeTheme, true, true);
      }
    });
  }
}

/**
 * Debounced theme re-apply for live color scheme changes.
 * Coalesces rapid attribute mutations (Primer sets multiple attrs at once)
 * into a single chart update pass.
 */
function scheduleThemeUpdate() {
  if (themeDebounceTimer) clearTimeout(themeDebounceTimer);
  themeDebounceTimer = setTimeout(() => {
    themeDebounceTimer = null;
    initAndApplyTheme(true);
  }, 100);
}

/** Initialize Highcharts with GitHub theme + accessibility module.
 *  Also watches for color scheme changes and re-applies the theme. */
export function useHighchartsInit() {
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      initAndApplyTheme(false); // First init — no existing charts to update
    }

    // Watch for OS color scheme changes (light ↔ dark)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', scheduleThemeUpdate);

    // Watch for Primer's data-color-mode attribute changes
    const observer = new MutationObserver(scheduleThemeUpdate);
    const primerRoot = document.querySelector('[data-color-mode]');
    if (primerRoot) {
      observer.observe(primerRoot, { attributes: true, attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'] });
    }

    return () => {
      mediaQuery.removeEventListener('change', scheduleThemeUpdate);
      observer.disconnect();
    };
  }, []);
}
