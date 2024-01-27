import { Injectable } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

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

interface Filter {
  startDate: Date;
  endDate: Date;
  workflow: string;
  sku: string;
}

type Product = 'Shared Storage' | 'Copilot' | 'Actions';

export interface CustomUsageReportLine extends UsageReportLine {
  value: number;
}

export interface CustomUsageReport extends UsageReport {
  lines: CustomUsageReportLine[];
}

@Injectable({
  providedIn: 'root'
})
export class UsageReportService {
  usageReportData!: string;
  usageReport!: CustomUsageReport;
  usageReportFiltered: BehaviorSubject<CustomUsageReportLine[]> = new BehaviorSubject<CustomUsageReportLine[]>([]);
  usageReportFilteredProduct: {[key: string]: Observable<CustomUsageReportLine[]>} = {};
  filters: Filter = {
    startDate: new Date(),
    endDate: new Date(),
    workflow: '',
    sku: '',
  } as Filter;
  days = 0;
  owners: string[] = [];
  repositories: string[] = [];
  workflows: string[] = [];
  skus: string[] = [];
  products: string[] = [];
  usernames: string[] = [];
  valueType: BehaviorSubject<'minutes' | 'cost'> = new BehaviorSubject<'minutes' | 'cost'>('minutes');
  
  constructor() {
  }

  get getUsageReport(): UsageReport {
    return this.usageReport;
  }

  get getWorkflows(): string[] {
    return this.workflows;
  }

  setValueType(value: 'minutes' | 'cost') {
    this.usageReport.lines.forEach(line => {
      if (value === 'minutes') {
        line.value = (line.quantity * line.multiplier) || 0;
      } else {
        line.value = (line.quantity * line.pricePerUnit * line.multiplier) || 0;
      }
    });
    this.usageReportFiltered.next(this.usageReport.lines);
    this.valueType.next(value);
  }

  async setUsageReportData(usageReportData: string, cb?: (usageReport: CustomUsageReport, percent: number) => void): Promise<CustomUsageReport> {
    this.usageReportData = usageReportData;
    this.usageReport = await readGithubUsageReport(this.usageReportData, cb as any) as CustomUsageReport;
    this.filters.startDate = this.usageReport.startDate;
    this.filters.endDate = this.usageReport.endDate;
    this.owners = [];
    this.repositories = [];
    this.workflows = [];
    this.skus = [];
    this.products = [];
    this.usernames = [];
    this.usageReport.lines.forEach(line => {
      if (!this.owners.includes(line.owner)) {
        this.owners.push(line.owner);
      }
      if (!this.repositories.includes(line.repositorySlug)) {
        this.repositories.push(line.repositorySlug);
      }
      if (!this.workflows.includes(line.actionsWorkflow)) {
        this.workflows.push(line.actionsWorkflow);
      }
      if (!this.skus.includes(line.sku)) {
        this.skus.push(line.sku);
      }
      if (!this.products.includes(line.product)) {
        this.products.push(line.product);
      }
      if (!this.usernames.includes(line.username)) {
        this.usernames.push(line.username);
      }
    });
    this.setValueType(this.valueType.value);
    this.usageReportFiltered.next(this.usageReport.lines);
    return this.usageReport;
  }

  applyFilter(filter: {
    startDate?: Date,
    endDate?: Date,
    workflow?: string,
    sku?: string,
  }): void {
    Object.assign(this.filters, filter);
    let filtered = this.usageReport.lines;
    if (this.filters.sku !== '') {
      filtered = filtered.filter(line => line.sku === this.filters.sku);
    }
    if (this.filters.workflow !== '') {
      filtered = filtered.filter(line => line.actionsWorkflow === this.filters.workflow);
    }
    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(line => {
        const lineDate = new Date(line.date);
        if (this.filters.startDate.getTime() === this.filters.endDate.getTime()) {
          const day = this.filters.startDate.toISOString().split('T')[0];
          const lineDay = lineDate.toISOString().split('T')[0];
          return day === lineDay;
        }
        return lineDate >= this.filters.startDate && lineDate <= this.filters.endDate;
      });
    }
    this.usageReportFiltered.next(filtered);
  }

  getUsageReportFiltered(): Observable<CustomUsageReportLine[]> {
    return this.usageReportFiltered.asObservable();
  }

  getUsageFilteredByProduct(product: Product): Observable<CustomUsageReportLine[]> {
    return this.getUsageReportFiltered().pipe(
      map(lines => lines.filter(line => line.product === product))
    );
  }

  getWorkflowsFiltered(): Observable<string[]> {
    return this.getUsageFilteredByProduct('Actions').pipe(
      map(lines => lines.map(line => line.actionsWorkflow).filter((workflow, index, self) => self.indexOf(workflow) === index)),
    )
  }

  getActionsTotalMinutes(): Observable<number> {
    return this.getUsageFilteredByProduct('Actions').pipe(
      map(lines => lines.reduce((total, line) => total + line.quantity, 0)),
    )
  }

  getActionsTotalCost(): Observable<number> {
    return this.getUsageFilteredByProduct('Actions').pipe(
      map(lines => lines.reduce((total, line) => total + line.pricePerUnit, 0))
    )
  }

  getValueType(): Observable<'minutes' | 'cost'> {
    return this.valueType.asObservable();
  }

  formatSku(sku: string) {
    return sku.split('Compute - ')[1].toLowerCase().replaceAll('_', ' ')
  }
}
