import { TitleCasePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ModelUsageReport, readModelUsageReport } from 'github-usage-report';
import { BehaviorSubject, Observable, map } from 'rxjs';

interface Filter {
  startDate: Date;
  endDate: Date;
  workflow: string;
  sku: string;
}

type Product = 'git_lfs' | 'packages' | 'copilot' | 'actions' | 'codespaces';

// Custom types to support both old and new CSV formats
export interface UsageReportLine {
  date: Date;
  product: string;
  sku: string;
  quantity: number;
  unitType: string;
  pricePerUnit: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  username: string;  // Empty string for new format
  organization: string;
  repositoryName: string;
  workflowName?: string;  // Optional - not present in new format
  workflowPath?: string;  // Optional - not present in new format
  costCenterName: string;
}

export interface UsageReport {
  days: number;
  startDate: Date;
  endDate: Date;
  lines: UsageReportLine[];
  formatType: 'legacy' | 'summarized';  // Track which format was used (legacy-15/14 → 'legacy', summarized-12 → 'summarized')
}

export interface CustomUsageReportLine extends UsageReportLine {
  value: number;
}

export interface CustomUsageReport extends UsageReport {
  lines: CustomUsageReportLine[];
}

type CsvFormat = 'legacy-15' | 'legacy-14' | 'summarized-12';

/**
 * Detects the CSV format based on header columns and column count
 * 
 * Supported formats:
 * - legacy-15: usage_at, product, sku, quantity, unit_type, applied_cost_per_quantity, 
 *              gross_amount, discount_amount, net_amount, username, organization, 
 *              repository_name, workflow_name, workflow_path, cost_center_name
 * - legacy-14: date, product, sku, quantity, unit_type, applied_cost_per_quantity,
 *              gross_amount, discount_amount, net_amount, username, organization,
 *              repository, workflow_path, cost_center_name
 * - summarized-12: date, product, sku, quantity, unit_type, applied_cost_per_quantity,
 *                  gross_amount, discount_amount, net_amount, organization, repository, cost_center_name
 */
function detectCsvFormat(headerLine: string): CsvFormat {
  const headers = headerLine.toLowerCase();
  const columnCount = headerLine.split(',').length;
  
  // Check for legacy format indicators
  if (headers.includes('usage_at') || headers.includes('workflow_name')) {
    return 'legacy-15';
  }
  
  // Check column count and presence of username/workflow_path
  if (columnCount >= 14 && (headers.includes('username') || headers.includes('workflow_path'))) {
    return 'legacy-14';
  }
  
  // New summarized format - 12 columns, no username or workflow data
  return 'summarized-12';
}

/**
 * Parse a single line from the legacy-15 format (15 columns)
 * Columns: usage_at, product, sku, quantity, unit_type, applied_cost_per_quantity, 
 *          gross_amount, discount_amount, net_amount, username, organization, 
 *          repository_name, workflow_name, workflow_path, cost_center_name
 */
function parseLegacy15Line(csv: string[]): UsageReportLine {
  return {
    date: new Date(Date.parse(csv[0])),
    product: csv[1],
    sku: csv[2],
    quantity: Number(csv[3]),
    unitType: csv[4],
    pricePerUnit: Number(csv[5]),
    grossAmount: Number(csv[6]),
    discountAmount: Number(csv[7]),
    netAmount: Number(csv[8]),
    username: csv[9] || '',
    organization: csv[10] || '',
    repositoryName: csv[11] || '',
    workflowName: csv[12] || undefined,
    workflowPath: csv[13] || undefined,
    costCenterName: csv[14] || '',
  };
}

/**
 * Parse a single line from the legacy-14 format (14 columns)
 * Columns: date, product, sku, quantity, unit_type, applied_cost_per_quantity,
 *          gross_amount, discount_amount, net_amount, username, organization,
 *          repository, workflow_path, cost_center_name
 */
function parseLegacy14Line(csv: string[]): UsageReportLine {
  return {
    date: new Date(Date.parse(csv[0])),
    product: csv[1],
    sku: csv[2],
    quantity: Number(csv[3]),
    unitType: csv[4],
    pricePerUnit: Number(csv[5]),
    grossAmount: Number(csv[6]),
    discountAmount: Number(csv[7]),
    netAmount: Number(csv[8]),
    username: csv[9] || '',
    organization: csv[10] || '',
    repositoryName: csv[11] || '',
    workflowName: undefined,
    workflowPath: csv[12] || undefined,
    costCenterName: csv[13] || '',
  };
}

/**
 * Parse a single line from the new summarized format (12 columns)
 * Columns: date, product, sku, quantity, unit_type, applied_cost_per_quantity,
 *          gross_amount, discount_amount, net_amount, organization, repository, cost_center_name
 */
function parseSummarizedLine(csv: string[]): UsageReportLine {
  return {
    date: new Date(Date.parse(csv[0])),
    product: csv[1],
    sku: csv[2],
    quantity: Number(csv[3]),
    unitType: csv[4],
    pricePerUnit: Number(csv[5]),
    grossAmount: Number(csv[6]),
    discountAmount: Number(csv[7]),
    netAmount: Number(csv[8]),
    username: '',  // Not available in new format
    organization: csv[9] || '',
    repositoryName: csv[10] || '',
    workflowName: undefined,  // Not available in new format
    workflowPath: undefined,  // Not available in new format
    costCenterName: csv[11] || '',
  };
}

/**
 * Custom CSV parser that supports both old and new GitHub usage report formats
 */
async function readGithubUsageReport(data: string): Promise<UsageReport> {
  return new Promise((resolve, reject) => {
    const usageReportLines: UsageReportLine[] = [];
    const lines = data.split(/\r?\n/);
    
    if (lines.length < 2) {
      reject(new Error('CSV file is empty or has no data rows'));
      return;
    }

    const formatType = detectCsvFormat(lines[0]);
    console.log(`Detected CSV format: ${formatType}`);

    lines.forEach((line, index) => {
      if (index === 0 || line.trim().length === 0) return;
      
      try {
        const csv = line.split(',').map(field => field.replace(/^"|"$/g, ''));
        
        let parsedLine: UsageReportLine;
        
        if (formatType === 'legacy-15') {
          if (csv.length !== 15) {
            console.warn(`Skipping line ${index + 1}: expected 15 columns for legacy-15 format, got ${csv.length}`);
            return;
          }
          parsedLine = parseLegacy15Line(csv);
        } else if (formatType === 'legacy-14') {
          if (csv.length !== 14) {
            console.warn(`Skipping line ${index + 1}: expected 14 columns for legacy-14 format, got ${csv.length}`);
            return;
          }
          parsedLine = parseLegacy14Line(csv);
        } else {
          // New summarized format: 12 columns
          if (csv.length !== 12) {
            console.warn(`Skipping line ${index + 1}: expected 12 columns for summarized format, got ${csv.length}`);
            return;
          }
          parsedLine = parseSummarizedLine(csv);
        }
        
        usageReportLines.push(parsedLine);
      } catch (err) {
        console.warn(`Skipping line ${index + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    });

    if (usageReportLines.length === 0) {
      reject(new Error('No valid data rows found in CSV file'));
      return;
    }

    // Sort by date to ensure correct date range
    usageReportLines.sort((a, b) => a.date.getTime() - b.date.getTime());

    const startDate = usageReportLines[0].date;
    const endDate = usageReportLines[usageReportLines.length - 1].date;
    
    // Map detailed format type to simplified version for UI
    const simplifiedFormatType: 'legacy' | 'summarized' = formatType === 'summarized-12' ? 'summarized' : 'legacy';
    
    resolve({
      startDate,
      endDate,
      days: (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      lines: usageReportLines,
      formatType: simplifiedFormatType,
    });
  });
}

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
  valueType: BehaviorSubject<'minutes' | 'cost'> = new BehaviorSubject<'minutes' | 'cost'>('cost');
  formatType: BehaviorSubject<'legacy' | 'summarized' | null> = new BehaviorSubject<'legacy' | 'summarized' | null>(null);
  hasWorkflowData: boolean = false;
  hasUsernameData: boolean = false
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
    "actions_custom_image_storage": 'Custom Image Storage',
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
    // Don't mutate original data - calculate on-the-fly
    const lines = this.usageReport.lines.map(line => ({
      ...line,
      value: value === 'minutes' ? (line.quantity || 0) : (line.quantity * line.pricePerUnit || 0)
    }));
    this.usageReportFiltered.next(lines);
    this.valueType.next(value);
  }

  async setUsageReportCopilotPremiumRequests(usageReportData: string, cb?: (usageReport: CustomUsageReport, percent: number) => void): Promise<ModelUsageReport> {
    this.usageReportPremiumRequestsData = usageReportData;
    await readModelUsageReport(this.usageReportPremiumRequestsData).then((report) => {
      this.usageReportCopilotPremiumRequests = report;
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
    
    // Track format type and available data
    this.formatType.next(this.usageReport.formatType);
    this.hasWorkflowData = false;
    this.hasUsernameData = false;
    
    this.usageReport.lines.forEach(line => {
      if (!this.owners.includes(line.organization)) {
        this.owners.push(line.organization);
      }
      if (!this.repositories.includes(line.repositoryName)) {
        this.repositories.push(line.repositoryName);
      }
      const workflow = line.workflowName || line.workflowPath;
      if (workflow && !this.workflows.includes(workflow)) {
        this.workflows.push(workflow);
        this.hasWorkflowData = true;
      }
      if (!this.skus.includes(line.sku)) {
        this.skus.push(line.sku);
      }
      if (!this.products.includes(line.product)) {
        this.products.push(line.product);
      }
      if (line.username && !this.usernames.includes(line.username)) {
        this.usernames.push(line.username);
        this.hasUsernameData = true;
      }
    });
    this.setValueType(this.valueType.value);
    console.log('Usage Report Loaded:', this.usageReport);
    console.log(`Format: ${this.usageReport.formatType}, Has Workflow Data: ${this.hasWorkflowData}, Has Username Data: ${this.hasUsernameData}`);
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
      filtered = filtered.filter(line => (line.workflowName || line.workflowPath) === this.filters.workflow);
    }
    if (this.filters.startDate && this.filters.endDate) {
      filtered = filtered.filter(line => {
        return line.date >= this.filters.startDate && line.date <= this.filters.endDate;
      });
    }
    // Apply value type transformation
    const valueType = this.valueType.value;
    const transformedFiltered = filtered.map(line => ({
      ...line,
      value: valueType === 'minutes' ? (line.quantity || 0) : (line.quantity * line.pricePerUnit || 0)
    }));
    this.usageReportFiltered.next(transformedFiltered);
  }

  getUsageReportFiltered(): Observable<CustomUsageReportLine[]> {
    return this.usageReportFiltered.asObservable();
  }

  getUsageFilteredByProduct(product: Product | Product[]): Observable<CustomUsageReportLine[]> {
    const _products = Array.isArray(product) ? product : [product];
    return this.getUsageReportFiltered().pipe(
      map(lines => lines.filter(line => _products.some(p => line.product.includes(p)))),
    );
  }

  getWorkflowsFiltered(): Observable<string[]> {
    return this.getUsageFilteredByProduct('actions').pipe(
      map(lines => lines
        .map(line => line.workflowName || line.workflowPath)
        .filter((workflow): workflow is string => workflow !== undefined && workflow !== '')
        .filter((workflow, index, self) => self.indexOf(workflow) === index)
      ),
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
}

const titlecasePipe = new TitleCasePipe();