import usageReportUrl from '../../examples/usageReport_1_7f2ed6006ee54fb8af73f5cbb7ac1f1d.csv?url';
import premiumRequestUrl from '../../examples/premiumRequestUsageReport_1_c6fca30f0acd458098a95808eaf43399.csv?url';
import tokenUsageUrl from '../../examples/Token.Usage.Report.csv?url';
import seatActivityUrl from '../../examples/octodemo-seat-activity-1774680875.csv?url';
import ghasCommittersUrl from '../../examples/ghas_active_committers_octodemo_2026-03-27T1521.csv?url';
import dormantUsersUrl from '../../examples/export-octodemo-1774679438.csv?url';
import enterpriseMembersUrl from '../../examples/export-octodemo-1774709193.csv?url';

const SAMPLES = [
  { name: 'usageReport.csv', url: usageReportUrl },
  { name: 'premiumRequestUsageReport.csv', url: premiumRequestUrl },
  { name: 'Token.Usage.Report.csv', url: tokenUsageUrl },
  { name: 'seat-activity.csv', url: seatActivityUrl },
  { name: 'ghas-active-committers.csv', url: ghasCommittersUrl },
  { name: 'dormant-users.csv', url: dormantUsersUrl },
  { name: 'enterprise-members.csv', url: enterpriseMembersUrl },
] as const;

/**
 * Load the example CSVs. These are emitted as static assets rather than
 * imported with `?raw`, which would inline all 15 MB of them into a JS chunk
 * the browser must download and parse as source before it can be a string.
 */
export async function loadSampleData(): Promise<Array<{ name: string; content: string }>> {
  return Promise.all(
    SAMPLES.map(async ({ name, url }) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load sample ${name}: ${response.status} ${response.statusText}`);
      }
      return { name, content: await response.text() };
    }),
  );
}
