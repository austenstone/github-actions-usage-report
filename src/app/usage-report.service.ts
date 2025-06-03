import { TitleCasePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { readGithubUsageReport, UsageReport, UsageReportLine } from 'github-usage-report';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map, shareReplay, tap } from 'rxjs';

interface Filter {
  startDate: Date;
  endDate: Date;
  workflow: string;
  sku: string;
}

type Product = 'git_lfs' | 'packages' | 'copilot' | 'actions' | 'codespaces';

export type GroupBy = keyof UsageReportLine;

export type UsageReportItem = UsageReportLine & {
  line: UsageReportLine;
  workflow: UsageReportLine & {
    avgTime: number;
    avgCost: number;
    totalRuns: number;
    totalCost: number;
  };
  value: number; // This can be minutes or cost based on the valueType
}

@Injectable({
  providedIn: 'root'
})
export class UsageReportService {
  usageReportData!: string;
  usageReport!: UsageReport;
  usageReportFiltered: BehaviorSubject<UsageReportLine[]> = new BehaviorSubject<UsageReportLine[]>([]);
  usageItemsFiltered: BehaviorSubject<UsageReportItem[]> = new BehaviorSubject<UsageReportItem[]>([]);
  filters: Filter = {
    startDate: new Date(),
    endDate: new Date(),
    workflow: '',
    sku: '',
  } as Filter;
  groupBy: GroupBy = 'organization';
  days = 0;
  owners: string[] = [];
  repositories: string[] = [];
  workflows: string[] = [];
  skus: string[] = [];
  products: string[] = [];
  usernames: string[] = [];
  valueType: BehaviorSubject<'minutes' | 'cost'> = new BehaviorSubject<'minutes' | 'cost'>('cost')
  skuMapping: { [key: string]: string } = {
    "actions_linux": 'Ubuntu 2',
    "actions_linux_16_core": 'Ubuntu 16',
    "actions_linux_16_core_arm": 'Ubuntu 16 (ARM)',
    "actions_linux_2_core_arm": 'Ubuntu 2 (ARM)',
    "actions_linux_32_core": 'Ubuntu 32',
    "actions_linux_32_core_arm": 'Ubuntu 32 (ARM)',
    "actions_linux_4_core": 'Ubuntu 4',
    "actions_linux_4_core_arm": 'Ubuntu 4 (ARM)',
    "actions_linux_4_core_gpu": 'Ubuntu 4 (GPU)',
    "actions_linux_64_core": 'Ubuntu 64',
    "actions_linux_64_core_arm": 'Ubuntu 64 (ARM)',
    "actions_linux_8_core": 'Ubuntu 8',
    "actions_linux_8_core_arm": 'Ubuntu 8 (ARM)',
    "actions_linux_2_core_advanced": 'Ubuntu 2 (Advanced)',
    "actions_macos": 'MacOS 3',
    "actions_macos_12_core": 'MacOS 12',
    "actions_macos_8_core": 'MacOS 8',
    "actions_macos_large": 'MacOS 12 (x86)',
    "actions_macos_xlarge": 'MacOS 6 (M1)',
    "actions_self_hosted_macos": 'MacOS (Self-Hosted)',
    "actions_windows": 'Windows 2',
    "actions_windows_16_core": 'Windows 16',
    "actions_windows_16_core_arm": 'Windows 16 (ARM)',
    "actions_windows_2_core_arm": 'Windows 2 (ARM)',
    "actions_windows_32_core": 'Windows 32',
    "actions_windows_32_core_arm": 'Windows 32 (ARM)',
    "actions_windows_4_core": 'Windows 4',
    "actions_windows_4_core_arm": 'Windows 4 (ARM)',
    "actions_windows_4_core_gpu": 'Windows 4 (GPU)',
    "actions_windows_64_core": 'Windows 64',
    "actions_windows_64_core_arm": 'Windows 64 (ARM)',
    "actions_windows_8_core": 'Windows 8',
    "actions_windows_8_core_arm": 'Windows 8 (ARM)',
    "actions_storage": 'Actions Storage',
    "actions_unknown": 'Actions Unknown',
    "copilot_enterprise": 'Copilot Enterprise',
    "copilot_for_business": 'Copilot Business',
    "git_lfs_storage": 'Git LFS Storage',
    "packages_storage": 'Packages Storage',
  };
  skuOrder = [
    'actions_linux',
    'actions_linux_4_core',
    'actions_linux_8_core',
    'actions_linux_16_core',
    'actions_linux_32_core',
    'actions_linux_64_core',
    'actions_windows',
    // 'actions_windows_4_core', DOESN'T EXIST
    'actions_windows_8_core',
    'actions_windows_16_core',
    'actions_windows_32_core',
    'actions_windows_64_core',
    'actions_macos',
    'actions_macos_12_core',
    'actions_macos_large',
    'actions_macos_xlarge',
    'actions_storage',
    'copilot_for_business',
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
    this.usageReportFiltered.next(this.usageReport.lines);
    this.usageItemsFiltered.next(this.calculateCopilotUsageItems(this.usageReport.lines));
    this.valueType.next(value);
  }

  async setUsageReportData(usageReportData: string, cb?: (usageReport: UsageReport, percent: number) => void): Promise<UsageReport> {
    this.usageReportData = usageReportData;
    this.usageReport = await readGithubUsageReport(this.usageReportData) as UsageReport;
    cb?.(this.usageReport, 100);
    this.filters.startDate = this.usageReport.startDate;
    this.filters.endDate = this.usageReport.endDate;
    this.owners = [];
    this.repositories = [];
    this.workflows = [];
    this.skus = [];
    this.products = [];
    this.usernames = [];
    this.usageReport.lines.forEach(line => {
      if (!this.owners.includes(line.organization)) {
        this.owners.push(line.organization);
      }
      if (!this.repositories.includes(line.repositoryName)) {
        this.repositories.push(line.repositoryName);
      }
      if (!this.workflows.includes(line.workflowName)) {
        this.workflows.push(line.workflowName);
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
    console.log()
    Object.assign(this.filters, filter);
    let filtered = this.usageReport.lines;
    if (this.filters.sku) {
      filtered = filtered.filter(line => line.sku === this.filters.sku);
    }
    if (this.filters.workflow) {
      filtered = filtered.filter(line => line.workflowName === this.filters.workflow);
    }
    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(line => {
        return line.date >= this.filters.startDate && line.date <= this.filters.endDate;
      });
    }
    this.usageReportFiltered.next(filtered);
    this.usageItemsFiltered.next(this.calculateCopilotUsageItems(filtered));
  }

  setGroupBy(groupBy: GroupBy): void {
    this.groupBy = groupBy;
    this.usageReportFiltered.next(this.usageReport.lines);
    this.usageItemsFiltered.next(this.calculateCopilotUsageItems(this.usageReport.lines));
  }

  private getUsageReportFiltered(): Observable<UsageReportLine[]> {
    return this.usageReportFiltered.asObservable();
  }

  getUsageFilteredByProduct(product: Product | Product[]): Observable<UsageReportLine[]> {
    const _products = Array.isArray(product) ? product : [product];
    return this.getUsageReportFiltered().pipe(
      map(lines => lines.filter(line => _products.some(p => line.product.includes(p)))),
    );
  }

  private getUsageItemsFiltered(): Observable<UsageReportItem[]> {
    return this.usageItemsFiltered.asObservable();
  }

  getUsageItemsFilteredByProduct(product: Product | Product[]): Observable<UsageReportItem[]> {
    const _products = Array.isArray(product) ? product : [product];
    const groupBy = this.groupBy; // Default grouping
    return this.usageItemsFiltered.pipe(
      map(lines => lines.filter(line => _products.some(p => line.product.includes(p)))),
    ).pipe(
      tap(() => {
        console.log('Getting Usage Items Filtered by Product:', product, 'Group By:', groupBy);
      })
    )
  }

  getWorkflowsFiltered(): Observable<string[]> {
    return this.getUsageFilteredByProduct('actions').pipe(
      map(lines => lines.map(line => line.workflowName).filter((workflow, index, self) => self.indexOf(workflow) === index)),
    )
  }

  getActionsTotalMinutes(): Observable<number> {
    return this.getUsageFilteredByProduct('actions').pipe(
      map(lines => lines.reduce((total, line) => total + line.quantity, 0)),
    )
  }

  getActionsTotalCost(): Observable<number> {
    return this.getUsageFilteredByProduct('actions').pipe(
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

  calculateCopilotUsageItems(usage: UsageReportLine[]): UsageReportItem[] {
    const groupBy = this.groupBy;
    return usage.reduce((acc, line) => {
        const item = acc.find(a => {
          if (groupBy === 'workflowName') {
            return a.workflowName === line.workflowName;
          } else if (groupBy === 'repositoryName') {
            return a.repositoryName === line.repositoryName;
          } else if (groupBy === 'sku') {
            return a.sku === this.formatSku(line.sku);
          } else if (groupBy === 'username') {
            return a.username === line.username;
          } else if (groupBy === 'costCenterName') {
            return a.costCenterName === line.costCenterName;
          } else if (groupBy === 'organization') {
            return a.organization === line.organization;
          } else if (groupBy === 'date') {
            return a.date?.toDateString() === line.date.toDateString();
          }
          return false;
        });
        if (item) {
          item.value += this.valueType.value === 'minutes' ? line.quantity : line.quantity * line.pricePerUnit;
          item.line = line;
          item.workflow = {
            ...line,
            avgTime: 0, // Placeholder, can be calculated later
            avgCost: 0, // Placeholder, can be calculated later
            totalRuns: (item.workflow.totalRuns || 1) + 1,
            totalCost: (item.workflow.totalCost || 0) + (this.valueType.value === 'minutes' ? line.quantity : line.quantity * line.pricePerUnit),
          };
        } else {
          acc.push({
            ...line,
            value: this.valueType.value === 'minutes' ? line.quantity : line.quantity * line.pricePerUnit,
            line: line,
            workflow: {
              ...line,
              avgTime: 0, // Placeholder, can be calculated later
              avgCost: 0, // Placeholder, can be calculated later
              totalRuns: 1, // First run
              totalCost: this.valueType.value === 'minutes' ? line.quantity : line.quantity * line.pricePerUnit,
            }
          });
        }
        return acc;
      }, [] as UsageReportItem[]);
    }
}

const titlecasePipe = new TitleCasePipe();