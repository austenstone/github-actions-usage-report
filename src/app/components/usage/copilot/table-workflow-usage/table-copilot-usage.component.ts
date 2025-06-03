import { AfterViewInit, Component, Input, OnChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportItem, UsageReportService } from 'src/app/usage-report.service';

interface UsageColumn {
  columnDef: string;
  header: string;
  cell: (element: any) => any;
  link?: (element: any) => string;
  footer?: () => any;
  sticky?: boolean;
}

interface CopilotUsageItem {
  runs: number;
  total: number;
  cost: number;
  pricePerUnit: number;
  costCenter?: string;
  organization?: string;
  username?: string;
  sticky?: boolean;
}

@Component({
  selector: 'app-table-copilot-usage',
  templateUrl: './table-copilot-usage.component.html',
  styleUrl: './table-copilot-usage.component.scss',
  standalone: false
})
export class TableCopilotUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  displayedColumns: string[] = [];
  @Input() data!: UsageReportItem[];
  @Input() currency!: string;
  @Input() groupBy!: 'costCenter' | 'organization' | 'username' | 'workflow' | 'repo' | 'sku' | 'user' | 'date';
  dataSource: MatTableDataSource<CopilotUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property
  tableType: 'organization' | 'costCenter' | 'username' = 'organization';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeColumns();
  }

  ngOnChanges() {
    if (!this.data) {
      return; // Avoid processing if data is not available yet
    }

    this.initializeColumns();
    let usage: CopilotUsageItem[] = [];
    let usageItems: CopilotUsageItem[] = (usage as CopilotUsageItem[]);
    usageItems = this.data.reduce((acc, line) => {
      const item = acc.find((a: any) => {
        if (this.groupBy === 'username') {
          return a.username === line.username;
        } else if (this.groupBy === 'costCenter') {
          return a.costCenter === line.costCenterName;
        } else if (this.groupBy === 'organization') {
          return a.organization === line.organization;
        }
        return false;
      });
      const month: string = line.date.toLocaleString('default', { month: 'short' });
      if (item) {
        if ((item as any)[month]) {
          (item as any)[month] += line.value;
        } else {
          (item as any)[month] = line.value || 0;
        }
        item.total += line.value;
        if (!this.columns.find(c => c.columnDef === month)) {
          this.columns.push({
            columnDef: month,
            header: month,
            cell: (workflowItem: any) => this.currency === 'cost' ? currencyPipe.transform(workflowItem[month]) : decimalPipe.transform(workflowItem[month]),
            footer: () => {
              if (!this.dataSource?.data) return '';
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : decimalPipe.transform(total);
            }
          });
        }
        item.cost += line.quantity * line.pricePerUnit;
        item.total += line.quantity;
        item.runs++;
      } else {
        acc.push({
          username: line.username,
          organization: line.organization,
          costCenter: line.costCenterName,
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          [month]: line.value,
        });
      }
      return acc;
    }, [] as CopilotUsageItem[]);

    usageItems.forEach((item) => {
      this.columns.forEach((column: any) => {
        if (!(item as any)[column.columnDef]) {
          (item as any)[column.columnDef] = 0;
        }
      });
    });
    usage = usageItems;

    // Update displayedColumns first
    this.displayedColumns = this.columns.map(c => c.columnDef);

    // Then update the data source
    this.dataSource = new MatTableDataSource<CopilotUsageItem>(usage);

    // Apply sort and pagination immediately, without setTimeout
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    // Mark for check to ensure proper change detection
    this.cdr.markForCheck();
  }

  ngAfterViewInit() {
    // We use next tick to avoid the ExpressionChangedAfterItHasBeenCheckedError
    Promise.resolve().then(() => {
      if (this.dataSource) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  initializeColumns() {
    let columns: UsageColumn[] = [];
    if (this.tableType === 'organization') {
      columns = [
        {
          columnDef: 'organization',
          header: 'Organization',
          cell: (workflowItem: CopilotUsageItem) => `${workflowItem.organization}`,
          sticky: true
        }
      ];
    } else if (this.tableType === 'costCenter') {
      columns = [
        {
          columnDef: 'costCenter',
          header: 'Cost Center',
          cell: (workflowItem: CopilotUsageItem) => `${workflowItem.costCenter}`,
          sticky: true
        }
      ];
    } else if (this.tableType === 'username') {
      columns = [
        {
          columnDef: 'username',
          header: 'Username',
          cell: (workflowItem: CopilotUsageItem) => `${workflowItem.username}`,
          link: (workflowItem: CopilotUsageItem) => `https://github.com/${workflowItem.username}`,
          sticky: true
        }
      ];
    }
    if (this.currency === 'minutes') {
      columns.push({
        columnDef: 'total',
        header: 'Total seats',
        cell: (workflowItem: CopilotUsageItem) => decimalPipe.transform(Math.floor(workflowItem.total)),
        footer: () => {
          if (!this.data) return '';
          return decimalPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0));
        }
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'cost',
        header: 'Total cost',
        cell: (workflowItem: CopilotUsageItem) => currencyPipe.transform(workflowItem.cost),
        footer: () => {
          if (!this.data) return '';
          return currencyPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0));
        }
      });
    }

    // Important: Clear columns before setting new ones
    this.columns = [];

    // Set new columns
    this.columns = columns;

    // Update displayedColumns immediately after updating columns
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Pipe({
  name: 'duration',
  standalone: false
})
export class DurationPipe implements PipeTransform {
  transform(minutes: number): string {
    const seconds = minutes * 60;
    if (seconds < 60) {
      return `${seconds} sec`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} min`;
    } else {
      return `${Math.round(seconds / 3600)} hr`;
    }
  }

}

const decimalPipe = new DecimalPipe('en-US');
const currencyPipe = new CurrencyPipe('en-US');