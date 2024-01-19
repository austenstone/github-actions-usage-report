import { Injectable } from '@angular/core';
import { UsageReport } from 'github-usage-report/types';
import { readGithubUsageReport } from 'github-usage-report/usage-report';

@Injectable({
  providedIn: 'root'
})
export class UsageReportService {
  usageReportData!: string;
  usageReport!: UsageReport;

  constructor() { }

  get getUsageReport(): UsageReport {
    return this.usageReport;
  }

  async setUsageReportData(usageReportData: string): Promise<UsageReport> {
    this.usageReportData = usageReportData;
    this.usageReport = await readGithubUsageReport(this.usageReportData)
    return this.usageReport;
  }
}
