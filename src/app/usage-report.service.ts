import { TitleCasePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { BehaviorSubject, Observable, map } from 'rxjs';

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
  const first = lines[1].split(',')[0];
  const dateDelim = first.includes('-') ? '-' : first.includes('/') ? '/' : null;
  if (dateDelim == null) throw new Error('Invalid date delimiter');
  for (const line of lines) {
    if (index == 0) {
      index++;
      continue;
    }
    const csv = line.split(',');
    let month, day, year;
    if (dateDelim === '/') {
      [month, day, year] = csv[0].split('/').map(Number);
      year = 2000 + year;
    } else if (dateDelim === '-') {
      [year, month, day] = csv[0].split('-').map(Number);
    }
    if (!year || !month || !day) throw new Error('Invalid date');
    const date = new Date(year, month - 1, day);
    const data: UsageReportLine = {
      date,
      product: csv[1],
      sku: csv[2],
      quantity: Number(csv[3]),
      unitType: csv[4],
      pricePerUnit: Number(csv[5]),
      multiplier: Number(csv[6]),
      owner: csv[7],
      repositorySlug: csv[8],
      username: csv[9],
      actionsWorkflow: csv[10] || 'deleted',
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
  usageReportFilteredProduct: { [key: string]: Observable<CustomUsageReportLine[]> } = {};
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
  valueType: BehaviorSubject<'minutes' | 'cost'> = new BehaviorSubject<'minutes' | 'cost'>('cost')
  skuMapping: { [key: string]: string } = {
    "Compute - UBUNTU": 'Ubuntu 2',
    "Compute - UBUNTU_16_CORE": 'Ubuntu 16',
    "Compute - UBUNTU_16_CORE_ARM": 'Ubuntu 16 (ARM)',
    "Compute - UBUNTU_2_CORE_ARM": 'Ubuntu 2 (ARM)',
    "Compute - UBUNTU_32_CORE": 'Ubuntu 32',
    "Compute - UBUNTU_32_CORE_ARM": 'Ubuntu 32 (ARM)',
    "Compute - UBUNTU_4_CORE": 'Ubuntu 4',
    "Compute - UBUNTU_4_CORE_ARM": 'Ubuntu 4 (ARM)',
    "Compute - UBUNTU_4_CORE_GPU": 'Ubuntu 4 (GPU)',
    "Compute - UBUNTU_64_CORE": 'Ubuntu 64',
    "Compute - UBUNTU_64_CORE_ARM": 'Ubuntu 64 (ARM)',
    "Compute - UBUNTU_8_CORE": 'Ubuntu 8',
    "Compute - UBUNTU_8_CORE_ARM": 'Ubuntu 8 (ARM)',
    "Compute - MACOS": 'MacOS 3',
    "Compute - MACOS_12_CORE": 'MacOS 12',
    "Compute - MACOS_8_CORE": 'MacOS 8',
    "Compute - MACOS_LARGE": 'MacOS 12 (x86)',
    "Compute - MACOS_XLARGE": 'MacOS 6 (M1)',
    "Compute - WINDOWS": 'Windows 2',
    "Compute - WINDOWS_16_CORE": 'Windows 16',
    "Compute - WINDOWS_16_CORE_ARM": 'Windows 16 (ARM)',
    "Compute - WINDOWS_2_CORE_ARM": 'Windows 2 (ARM)',
    "Compute - WINDOWS_32_CORE": 'Windows 32',
    "Compute - WINDOWS_32_CORE_ARM": 'Windows 32 (ARM)',
    "Compute - WINDOWS_4_CORE": 'Windows 4',
    "Compute - WINDOWS_4_CORE_ARM": 'Windows 4 (ARM)',
    "Compute - WINDOWS_4_CORE_GPU": 'Windows 4 (GPU)',
    "Compute - WINDOWS_64_CORE": 'Windows 64',
    "Compute - WINDOWS_64_CORE_ARM": 'Windows 64 (ARM)',
    "Compute - WINDOWS_8_CORE": 'Windows 8',
    "Compute - WINDOWS_8_CORE_ARM": 'Windows 8 (ARM)',
  };
  skuOrder = [
    'Compute - UBUNTU',
    'Compute - UBUNTU_4_CORE',
    'Compute - UBUNTU_8_CORE',
    'Compute - UBUNTU_16_CORE',
    'Compute - UBUNTU_32_CORE',
    'Compute - UBUNTU_64_CORE',
    'Compute - WINDOWS',
    // 'Compute - WINDOWS_4_CORE', DOESN'T EXIST
    'Compute - WINDOWS_8_CORE',
    'Compute - WINDOWS_16_CORE',
    'Compute - WINDOWS_32_CORE',
    'Compute - WINDOWS_64_CORE',
    'Compute - MACOS',
    'Compute - MACOS_12_CORE',
    'Compute - MACOS_LARGE',
    'Compute - MACOS_XLARGE',
    'Data Transfer',
    'Shared Storage',
    'Copilot Business',
  ].map(sku => this.formatSku(sku));
  monthsOrder = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

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
        line.value = (line.quantity) || 0;
      } else {
        line.value = (line.quantity * line.pricePerUnit) || 0;
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
    if (this.filters.sku) {
      filtered = filtered.filter(line => line.sku === this.filters.sku);
    }
    if (this.filters.workflow) {
      filtered = filtered.filter(line => line.actionsWorkflow === this.filters.workflow);
    }
    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(line => {
        return line.date >= this.filters.startDate && line.date <= this.filters.endDate;
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
    if (!sku) return sku;
    if (this.skuMapping[sku]) return this.skuMapping[sku];
    const skuParts = sku.split('Compute - ');
    if (skuParts.length < 2) return sku;
    const runtime = skuParts[1];
    let formatted = runtime.replaceAll('_', ' ').replace(' CORE', '');
    formatted = titlecasePipe.transform(formatted);
    formatted = formatted.replace('Macos', 'MacOS');
    if (formatted.includes('ARM')) {
      return `${formatted} (ARM)`
    }
    return formatted;
  }
}

const titlecasePipe = new TitleCasePipe();