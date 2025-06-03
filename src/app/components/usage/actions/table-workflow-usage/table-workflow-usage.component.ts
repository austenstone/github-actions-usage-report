import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { GroupBy, UsageReportItem, UsageReportService } from 'src/app/usage-report.service';

export interface WorkflowUsageItem {
  workflowName: string;
  workflowPath: string;
  avgTime: number;
  avgCost: number;
  runs: number;
  repositoryName: string;
  total: number;
  cost: number;
  pricePerUnit: number;
  sku: string;
  username: string;
  organization: string;
  costCenterName: string;
  date?: Date;
}

interface RepoUsageItem {
  avgTime: number;
  avgCost: number;
  repositoryName: string;
  runs: number;
  total: number;
  cost: number;
  sku: string;
}

interface SkuUsageItem {
  avgTime: number;
  avgCost: number;
  sku: string;
  runs: number;
  total: number;
  cost: number;
}

interface UsageColumn {
  sticky?: boolean;
  columnDef: string;
  header: string;
  cell: (element: any) => any;
  link?: (element: any) => string;
  footer?: () => any;
  tooltip?: (element: any) => any;
  icon?: (element: any) => string;
  date?: Date;
}

@Component({
    selector: 'app-table-workflow-usage',
    templateUrl: './table-workflow-usage.component.html',
    styleUrl: './table-workflow-usage.component.scss',
    standalone: false
})
export class TableWorkflowUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  monthColumns = [] as UsageColumn[];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: UsageReportItem[];
  @Input() currency!: string;
  @Input() groupBy!: GroupBy;
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) {
    this.usageReportService.groupBy
  }

  ngOnChanges() {
    this.groupBy = this.usageReportService.groupBy;
    this.initializeColumns();
    let usage: WorkflowUsageItem[] | RepoUsageItem[] | SkuUsageItem[] = [];
    let usageItems: WorkflowUsageItem[] = (usage as WorkflowUsageItem[]);
    console.log('Data received:', this.data);
    if (!this.data) return;
    usageItems = this.data.reduce((acc, line) => {
      const item = acc.find(a => {
        if (this.groupBy === 'workflowName') {
          return a.workflowName === line.workflowName
        } else if (this.groupBy === 'repositoryName') {
          return a.repositoryName === line.repositoryName;
        } else if (this.groupBy === 'sku') {
          return a.sku === this.usageReportService.formatSku(line.sku);
        } else if (this.groupBy === 'username') {
          return a.username === line.username;
        } else if (this.groupBy === 'costCenterName') {
          return a.costCenterName === line.costCenterName;
        } else if (this.groupBy === 'organization') {
          return a.organization === line.organization;
        } else if (this.groupBy === 'date') {
          return a.date?.toDateString() === line.date.toDateString();
        }
        return false
      });
      const month: string = line.date.toLocaleString('default', { month: 'short', year: '2-digit'});
      if (item) {
        if ((item as any)[month]) {
          (item as any)[month] += line.value;
        } else {
          (item as any)[month] = line.value || 0;
        }
        if (!this.columns.find(c => c.columnDef === month)) {
          const column: UsageColumn = {
            columnDef: month,
            header: month,
            cell: (workflowItem: any) => this.currency === 'cost' ? currencyPipe.transform(workflowItem[month]) : decimalPipe.transform(workflowItem[month]),
            footer: () => {
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : decimalPipe.transform(total);
            },
            date: new Date(line.date),
          };
          const lastMonth: string = new Date(line.date.getFullYear(), line.date.getMonth() - 1).toLocaleString('default', { month: 'short' });
          const lastMonthValue = (item as any)[lastMonth];
          if (lastMonthValue) {
            column.tooltip = (workflowItem: WorkflowUsageItem) => {
              return (workflowItem as any)[month + 'PercentChange']?.toFixed(2) + '%';
            };
          }
          this.columns.push(column);
          this.monthColumns.push(column);
        }
        item.cost += line.quantity * line.pricePerUnit;
        item.total += line.quantity;
        item.runs++;
      } else {
        acc.push({
          workflowName: line.workflowName,
          workflowPath: line.workflowPath,
          username: line.username,
          organization: line.organization,
          costCenterName: line.costCenterName,
          repositoryName: line.repositoryName,
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          avgCost: line.quantity * line.pricePerUnit,
          avgTime: line.value,
          [month]: line.value,
          sku: this.usageReportService.formatSku(line.sku),
          date: line.date,
        });
      }
      return acc;
    }, [] as WorkflowUsageItem[]);

    this.data.forEach((item) => {
      this.monthColumns.forEach((column: UsageColumn) => {
        const month = column.columnDef;
        if (!(item as any)[month]) {
          (item as any)[month] = 0;
        }
        const lastMonth: string = new Date(new Date().getFullYear(), this.usageReportService.monthsOrder.indexOf(month) - 1).toLocaleString('default', { month: 'short' });
        const lastMonthValue = (item as any)[lastMonth];
        const percentageChanged = this.calculatePercentageChange(lastMonthValue, (item as any)[month]);
        (item as any)[month + 'PercentChange'] = percentageChanged;
      });
    });
    usage = usageItems;
    this.columns = this.columns.sort((a, b) => (!a.date || !b.date) ? 0 : a.date.getTime() - b.date.getTime()); 
    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource.data = usage;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    const initial = this.dataSource.sortData;
    this.dataSource.sortData = (data: (WorkflowUsageItem | RepoUsageItem | SkuUsageItem)[], sort: MatSort) => {
      switch (sort.active) {
        case 'sku':
          return data.sort((a, b) => {
            const orderA = this.usageReportService.skuOrder.indexOf(a.sku);
            const orderB = this.usageReportService.skuOrder.indexOf(b.sku);
            return sort.direction === 'asc' ? orderA - orderB : orderB - orderA;
          });
        default:
          return initial(data, sort);
      }
    };
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
    console.log('Initializing columns with groupBy:', this.groupBy);
    if (this.groupBy === 'workflowName') {
      columns = [
        {
          columnDef: 'workflowName',
          header: 'Workflow',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.workflowName}`,
          link: (workflowItem: WorkflowUsageItem) => `https://github.com/${workflowItem.organization}/${workflowItem.repositoryName}/actions/workflows/${workflowItem.workflowPath}`,
          sticky: true,
        },
        {
          columnDef: 'repositoryName',
          header: 'Repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repositoryName}`,
          link: (workflowItem: WorkflowUsageItem) => `https://github.com/${workflowItem.organization}/${workflowItem.repositoryName}`,
        },
        {
          columnDef: 'runner',
          header: 'Runner Type',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.sku}`,
        },
      ];
    } else if (this.groupBy === 'repositoryName') {
      columns = [
        {
          columnDef: 'repositoryName',
          header: 'Source repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repositoryName}`,
          link: (workflowItem: WorkflowUsageItem) => `https://github.com/${workflowItem.organization}/${workflowItem.repositoryName}`,
          sticky: true,
        },
      ];
    } else if (this.groupBy === 'sku') {
      columns = [
        {
          columnDef: 'sku',
          header: 'Runner',
          cell: (workflowItem: WorkflowUsageItem) => this.usageReportService.formatSku(workflowItem.sku),
          sticky: true,
        },
      ];
    } else if (this.groupBy === 'username') {
      columns = [
        {
          columnDef: 'username',
          header: 'User',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.username,
          link: (workflowItem: WorkflowUsageItem) => `https://github.com/${workflowItem.username}`,
          sticky: true,
        },
      ];
    } else if (this.groupBy === 'costCenterName') {
      columns = [
        {
          columnDef: 'costCenterName',
          header: 'Cost Center',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.costCenterName,
          sticky: true,
        },
      ];
    } else if (this.groupBy === 'organization') {
      columns = [
        {
          columnDef: 'organization',
          header: 'Organization',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.organization,
          link: (workflowItem: WorkflowUsageItem) => `https://github.com/${workflowItem.organization}`,
          sticky: true,
        },
      ];
    } else if (this.groupBy === 'date') {
      columns = [
        {
          columnDef: 'date',
          header: 'Date',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.date ? workflowItem.date.toLocaleDateString() : '',
          sticky: true,
          date: new Date(),
        },
      ];
    }

    columns.push({
      columnDef: 'runs',
      header: 'Runs',
      cell: (workflowItem: WorkflowUsageItem) => `${decimalPipe.transform(workflowItem.runs)}`,
      footer: () => {
        const total = this.dataSource.data.reduce((acc, item) => acc + item.runs, 0);
        return decimalPipe.transform(total);
      }
    })
    if (this.currency === 'minutes') {
      columns.push({
        columnDef: 'avgTime',
        header: 'Avg time',
        cell: (workflowItem: WorkflowUsageItem) => `${durationPipe.transform(workflowItem.avgTime)}`,
        footer: () => durationPipe.transform(this.dataSource.data.reduce((acc, line) => acc += line.avgTime, 0) / this.dataSource.data.length)
      }, {
        columnDef: 'total',
        header: 'Total',
        cell: (workflowItem: WorkflowUsageItem) => decimalPipe.transform(Math.floor(workflowItem.total)),
        footer: () => decimalPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'avgCost',
        header: 'Avg run',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.avgCost),
        footer: () => currencyPipe.transform(this.dataSource.data.reduce((acc, line) => acc += line.cost, 0) / this.dataSource.data.length)
      }, {
        columnDef: 'cost',
        header: 'Total',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.cost),
        footer: () => currencyPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
      });
    }
    columns[0].footer = () => 'Total';
    this.columns = columns;
    this.monthColumns = [];
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }

  calculatePercentageChange(oldValue: number, newValue: number) {
    return (oldValue === 0) ? 0 : ((newValue - oldValue) / oldValue) * 100;
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

const durationPipe = new DurationPipe();
const decimalPipe = new DecimalPipe('en-US');
const currencyPipe = new CurrencyPipe('en-US');