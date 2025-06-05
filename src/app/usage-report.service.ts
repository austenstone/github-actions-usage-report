import { TitleCasePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ModelUsageReport, readGithubUsageReport, readModelUsageReport, UsageReport, UsageReportLine } from 'github-usage-report';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

const titlecasePipe = new TitleCasePipe();

interface Filter {
  startDate: Date;
  endDate: Date;
  workflow: string;
  sku: string;
}

export interface CustomUsageReportLine extends UsageReportLine {
  value: number;
}

export interface CustomUsageReport extends UsageReport {
  lines: CustomUsageReportLine[];
}

export interface SharedStorageUsageItem {
  repositoryName: string;
  count: number;
  avgSize: number;
  total: number;
  totalCost: number;
  avgCost: number;
  pricePerUnit: number;
  costPerDay: number;
}

export interface WorkflowUsageItem {
  workflowName: string;
  workflowPath: string;
  costCenterName: string;
  organization: string;
  avgTime: number;
  avgCost: number;
  runs: number;
  repositoryName: string;
  total: number;
  cost: number;
  pricePerUnit: number;
  sku: string;
  username: string;
  [month: string]: any; // For dynamic month columns
  avgSize: number; // For shared storage
  costPerDay: number; // For shared storage
  count: number; // For shared storage
}

export interface RepoUsageItem {
  avgTime: number;
  avgCost: number;
  repositoryName: string;
  runs: number;
  total: number;
  cost: number;
  sku: string;
  [month: string]: any; // For dynamic month columns
}

export interface SkuUsageItem {
  avgTime: number;
  avgCost: number;
  sku: string;
  runs: number;
  total: number;
  cost: number;
  [month: string]: any; // For dynamic month columns
}

export interface UserUsageItem {
  avgTime: number;
  avgCost: number;
  username: string;
  runs: number;
  total: number;
  cost: number;
  [month: string]: any; // For dynamic month columns
}

export interface UsageColumn {
  sticky?: boolean;
  columnDef: string;
  header: string;
  cell: (element: any) => any;
  footer?: () => any;
  tooltip?: (element: any) => any;
  icon?: (element: any) => string;
  date?: Date;
}

export interface AggregatedUsageData {
  items: WorkflowUsageItem[] | RepoUsageItem[] | SkuUsageItem[] | UserUsageItem[];
  availableMonths: string[]; // Just the month keys, let components build columns
  dateRange: { start: Date; end: Date };
}

export type AggregationType = 'workflow' | 'sku' | 'organization' | 'repositoryName' | 'costCenterName' | 'username' | 'workflowPath';
export type Product = 'git_lfs' | 'packages' | 'copilot' | 'actions' | 'codespaces';

@Injectable({
  providedIn: 'root'
})
export class UsageReportService {
  usageReportData!: string;
  usageReportPremiumRequestsData!: string;
  usageReport!: CustomUsageReport;
  usageReportCopilotPremiumRequests!: ModelUsageReport;
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

  async setUsageReportCopilotPremiumRequests(usageReportData: string, cb?: (usageReport: CustomUsageReport, percent: number) => void): Promise<ModelUsageReport> {
    this.usageReportPremiumRequestsData = usageReportData;
    await readModelUsageReport(this.usageReportPremiumRequestsData).then((report) => {
      this.usageReportCopilotPremiumRequests = report;
      cb?.(this.usageReport, 100);
    });
    return this.usageReportCopilotPremiumRequests;
  }

  async setUsageReportData(usageReportData: string, cb?: (usageReport: CustomUsageReport, percent: number) => void): Promise<CustomUsageReport> {
    this.usageReportData = usageReportData;
    this.usageReport = await readGithubUsageReport(this.usageReportData) as CustomUsageReport;
    
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
  }

  getUsageReportFiltered(): Observable<CustomUsageReportLine[]> {
    return this.usageReportFiltered.asObservable();
  }

  getUsageFilteredByProduct(product: Product | Product[]): Observable<CustomUsageReportLine[]> {
    const _products = Array.isArray(product) ? product : [product];
    return this.getUsageReportFiltered().pipe(
      map(lines => lines.filter(line => _products.some(p => {
        const filtered = line.product.includes(p);
        if (product === 'actions') {
          if (line.sku === 'actions_storage') {
            return false; // Exclude storage from actions
          }
        }
        return filtered;
      }))),
    );
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

  calculatePercentageChange(oldValue: number, newValue: number): number {
    return (oldValue === 0) ? 0 : ((newValue - oldValue) / oldValue) * 100;
  }

  getAggregatedUsageData(aggregationType: AggregationType, product?: Product | Product[]): Observable<AggregatedUsageData> {
    const productFilter = product || 'actions';
    
    return this.getUsageFilteredByProduct(productFilter).pipe(
      map(data => {
        // Calculate aggregated data directly without caching
        return this.aggregateUsageData(data, aggregationType);
      })
    );
  }

  private aggregateUsageData(data: CustomUsageReportLine[], aggregationType: AggregationType): AggregatedUsageData {
    const availableMonths: string[] = [];
    const dateRange = { start: new Date(), end: new Date() };
    
    const usageItems = data.reduce((acc, line) => {
      const item = acc.find(a => {
        switch (aggregationType) {
          case 'sku':
            return (a as WorkflowUsageItem).sku === this.formatSku(line.sku);
          case 'organization':
            return (a as WorkflowUsageItem).organization === line.organization;
          case 'costCenterName':
            return (a as WorkflowUsageItem).costCenterName === line.costCenterName;
          case 'repositoryName':
            return (a as WorkflowUsageItem).repositoryName === line.repositoryName;
          case 'workflow':
            return (a as WorkflowUsageItem).workflowName === line.workflowName;
          case 'workflowPath':
            return (a as WorkflowUsageItem).workflowPath === line.workflowPath;
          case 'username':
            return (a as WorkflowUsageItem).username === line.username;
          default:
            return false;
        }
      });

      const month: string = line.date.toLocaleString('default', { month: 'short', year: '2-digit' });

      // Track available months
      if (!availableMonths.includes(month)) {
        availableMonths.push(month);
      }
      
      // Track date range
      if (line.date < dateRange.start) dateRange.start = line.date;
      if (line.date > dateRange.end) dateRange.end = line.date;
      
      if (item) {
        if ((item as any)[month]) {
          (item as any)[month] += line.value;
        } else {
          (item as any)[month] = line.value || 0;
        }

        item.cost += line.quantity * line.pricePerUnit;
        item.total += line.quantity;
        item.runs++;
      } else {
        const newItem: WorkflowUsageItem = {
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          avgCost: line.quantity * line.pricePerUnit,
          avgTime: line.value,
          [month]: line.value,
          workflowName: line.workflowName,
          workflowPath: line.workflowPath,
          costCenterName: line.costCenterName,
          organization: line.organization,
          repositoryName: line.repositoryName,
          sku: this.formatSku(line.sku),
          username: line.username,
          // shared-storage
          avgSize: line.value,
          costPerDay: line.quantity * line.pricePerUnit,
          count: 1, // For shared storage
        };

        // Set aggregation-specific properties
        switch (aggregationType) {
          case 'workflow':
            newItem.workflowName = line.workflowName;
            newItem.repositoryName = line.repositoryName;
            newItem.sku = this.formatSku(line.sku);
            newItem.username = line.username;
            break;
          case 'workflowPath':
            newItem.workflowName = line.workflowName;
            newItem.workflowPath = line.workflowPath;
            newItem.costCenterName = line.costCenterName;
            newItem.organization = line.organization;
            newItem.sku = this.formatSku(line.sku);
            newItem.username = line.username;
            break;
          case 'costCenterName':
            newItem.costCenterName = line.costCenterName;
            newItem.organization = line.organization;
            newItem.sku = this.formatSku(line.sku);
            newItem.username = line.username;
            break;
          case 'organization':
            newItem.organization = line.organization;
            newItem.sku = this.formatSku(line.sku);
            newItem.username = line.username;
            break;
          case 'repositoryName':
            newItem.repositoryName = line.repositoryName;
            newItem.sku = this.formatSku(line.sku);
            break;
          case 'sku':
            newItem.sku = this.formatSku(line.sku);
            break;
          case 'username':
            newItem.username = line.username;
            break;
        }

        acc.push(newItem);
      }
      return acc;
    }, [] as any[]);

    // Calculate averages and ensure all items have all month properties
    usageItems.forEach((item) => {
      availableMonths.forEach((month: string) => {
        if (!(item as any)[month]) {
          (item as any)[month] = 0;
        }
        
        // Calculate percentage change from previous month if needed
        const monthIndex = availableMonths.indexOf(month);
        if (monthIndex > 0) {
          const previousMonth = availableMonths[monthIndex - 1];
          const lastMonthValue = (item as any)[previousMonth] || 0;
          const percentageChanged = this.calculatePercentageChange(lastMonthValue, (item as any)[month]);
          (item as any)[month + 'PercentChange'] = percentageChanged;
        }
      });

      item.avgTime = item.runs > 0 ? item.total / item.runs : 0;
      item.avgCost = item.runs > 0 ? item.cost / item.runs : 0;
    });

    // Sort months chronologically
    availableMonths.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      items: usageItems,
      availableMonths: availableMonths,
      dateRange: dateRange
    };
  }
  
  // Helper method for components to get month columns
  createMonthColumns(availableMonths: string[], currency: 'minutes' | 'cost', dataSource?: any): UsageColumn[] {
    return availableMonths.map(month => ({
      columnDef: month,
      header: month,
      cell: (item: any) => item[month] || 0,
      footer: () => {
        if (!dataSource?.data) return '';
        const total = dataSource.data.reduce((acc: number, item: any) => acc + (item[month] || 0), 0);
        return total;
      },
      date: new Date(month)
    }));
  }
}