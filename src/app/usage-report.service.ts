import { Injectable } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { BehaviorSubject, Observable } from 'rxjs';

const readGithubUsageReport = async (data: string, cb?: (usageReport: UsageReport, percent: number) => void): Promise<UsageReport> => {
  let percent = 0;
  let total = 0;
  let index = 0;
  const usageReport: UsageReport = {
    days: 0,
    startDate: new Date(),
    endDate: new Date(),
    lines: [],
  };

  const lines = data.split('\n');
  total = lines.length;
  for (const line of lines) {
    if (index == 0) {
      index++;
      continue;
    }
    const csv = line.split(',');
    const data: UsageReportLine = {
      date: new Date(Date.parse(csv[0])),
      product: csv[1],
      sku: csv[2],
      quantity: Number(csv[3]),
      unitType: csv[4],
      pricePerUnit: Number(csv[5]),
      multiplier: Number(csv[6]),
      owner: csv[7],
      repositorySlug: csv[8],
      username: csv[9],
      actionsWorkflow: csv[10],
      notes: csv[11],
    };
    if (data.product != null) {
      if (cb) {
        await cb(usageReport, percent);
      }
      usageReport.lines.push(data);
    }
    index++;
    percent = Math.round((index / (total - 1)) * 100);
  }
  usageReport.startDate = usageReport.lines[0].date;
  usageReport.endDate = usageReport.lines[usageReport.lines.length - 1].date;
  usageReport.days = (usageReport.endDate.getTime() - usageReport.startDate.getTime()) / (1000 * 60 * 60 * 24);
  return Promise.resolve(usageReport)
};

@Injectable({
  providedIn: 'root'
})
export class UsageReportService {
  usageReportData!: string;
  usageReport!: UsageReport;
  usageReportFiltered: BehaviorSubject<UsageReportLine[]> = new BehaviorSubject<UsageReportLine[]>([]);
  
  constructor() { }

  get getUsageReport(): UsageReport {
    return this.usageReport;
  }

  async setUsageReportData(usageReportData: string, cb?: (usageReport: UsageReport, percent: number) => void): Promise<UsageReport> {
    this.usageReportData = usageReportData;
    this.usageReport = await readGithubUsageReport(this.usageReportData, cb)
    this.usageReportFiltered.next(this.usageReport.lines);
    return this.usageReport;
  }

  getWorkflows(): string[] {
    return this.usageReport.lines.map(line => line.actionsWorkflow).filter((value, index, self) => self.indexOf(value) === index);
  }

  getUsageReportFiltered(): Observable<UsageReportLine[]> {
    return this.usageReportFiltered;
  }

  filterByDate(startDate: Date, endDate: Date): UsageReportLine[] {
    return this.usageReport.lines.filter(line => {
      const lineDate = new Date(line.date);
      if (startDate.getTime() === endDate.getTime()) {
        const day = startDate.toISOString().split('T')[0];
        const lineDay = lineDate.toISOString().split('T')[0];
        return day === lineDay;
      }
      return lineDate >= startDate && lineDate <= endDate;
    });
  }

  filterByWorkflow(workflow: string): UsageReportLine[] {
    if (!workflow || workflow === '') return this.usageReport.lines;
    return this.usageReport.lines.filter(line => line.actionsWorkflow === workflow);
  }

  applyDateFilter(startDate: Date, endDate: Date): void {
    const filtered = this.filterByDate(startDate, endDate);
    this.usageReportFiltered.next(filtered);
  }

  applyWorkflowFilter(workflow: string): void {
    this.usageReportFiltered.next(this.filterByWorkflow(workflow));
  }

  formatSku(sku: string) {
    return sku.split('Compute - ')[1].toLowerCase().replaceAll('_', ' ')
  }
}
