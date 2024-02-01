import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

interface WorkflowUsageItem {
  workflow: string;
  avgTime: number;
  avgCost: number;
  runs: number;
  repo: string;
  total: number;
  cost: number;
  pricePerUnit: number;
  sku: string;
  username: string;
}

interface RepoUsageItem {
  avgTime: number;
  avgCost: number;
  repo: string;
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
  footer?: () => any;
  tooltip?: (element: any) => any;
  icon?: (element: any) => string;
  date?: Date;
}

@Component({
  selector: 'app-table-workflow-usage',
  templateUrl: './table-workflow-usage.component.html',
  styleUrl: './table-workflow-usage.component.scss'
})
export class TableWorkflowUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property
  tableType: 'workflow' | 'repo' | 'sku' | 'user' = 'sku';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.initializeColumns();
    let usage: WorkflowUsageItem[] | RepoUsageItem[] | SkuUsageItem[] = [];
    let usageItems: WorkflowUsageItem[] = (usage as WorkflowUsageItem[]);
    usageItems = this.data.reduce((acc, line) => {
      const item = acc.find(a => {
        if (this.tableType === 'workflow') {
          return a.workflow === line.actionsWorkflow
        } else if (this.tableType === 'repo') {
          return a.repo === line.repositorySlug;
        } else if (this.tableType === 'sku') {
          return a.sku === this.usageReportService.formatSku(line.sku);
        } else if (this.tableType === 'user') {
          return a.username === line.username;
        }
        return false
      });
      const month: string = line.date.toLocaleString('default', { month: 'short'});
      if (item) {
        if ((item as any)[month]) {
          (item as any)[month] += line.value;
        } else {
          (item as any)[month] = line.value || 0;
        }
        item.total += line.value;
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
          const lastMonth: string = new Date(line.date.getFullYear(), line.date.getMonth() - 1).toLocaleString('default', { month: 'long' });
          const lastMonthValue = (item as any)[lastMonth];
          if (lastMonthValue) {
            column.tooltip = (workflowItem: WorkflowUsageItem) => {
              return (workflowItem as any)[month + 'PercentChange'].toFixed(2) + '%';
            };
            column.icon = (workflowItem: WorkflowUsageItem) => {
              const percentageChanged = (workflowItem as any)[month + 'PercentChange'];
              if (percentageChanged > 0) {
                return 'trending_up';
              } else if (percentageChanged < 0) {
                return 'trending_down';
              } else {
                return 'trending_flat';
              }
            };
          }
          this.columns.push(column);
        }
        item.cost += line.quantity * line.pricePerUnit;
        item.total += line.quantity;
        item.runs++;
      } else {
        acc.push({
          workflow: line.actionsWorkflow,
          repo: line.repositorySlug,
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          avgCost: line.quantity * line.pricePerUnit,
          avgTime: line.value,
          [month]: line.value,
          sku: this.usageReportService.formatSku(line.sku),
          username: line.username,
        });
      }
      return acc;
    }, [] as WorkflowUsageItem[]);

    usageItems.forEach((item) => {
      this.usageReportService.monthsOrder.forEach((month: string) => {
        if (!(item as any)[month]) {
          (item as any)[month] = 0;
        }
        const lastMonth: string = new Date(new Date().getFullYear(), this.usageReportService.monthsOrder.indexOf(month) - 1).toLocaleString('default', { month: 'long' });
        const lastMonthValue = (item as any)[lastMonth];
        const percentageChanged = this.calculatePercentageChange(lastMonthValue, (item as any)[month]);
        (item as any)[month + 'PercentChange'] = percentageChanged;
      });

      item.avgTime = item.total / item.runs;
      item.avgCost = item.cost / item.runs;
    });
    usage = usageItems;
    // sort the columns by date
    this.columns = this.columns.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0)); 
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
    if (this.tableType === 'workflow') {
      columns = [
        {
          columnDef: 'workflow',
          header: 'Workflow',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.workflow}`,
          sticky: true,
        },
        {
          columnDef: 'repo',
          header: 'Repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repo}`,
        },
        {
          columnDef: 'runner',
          header: 'Runner Type',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.sku}`,
        },
      ];
    } else if (this.tableType === 'repo') {
      columns = [
        {
          columnDef: 'repo',
          header: 'Source repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repo}`,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'sku') {
      columns = [
        {
          columnDef: 'sku',
          header: 'Runner',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.sku,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'user') {
      columns = [
        {
          columnDef: 'username',
          header: 'User',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.username,
          sticky: true,
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
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }

  calculatePercentageChange(oldValue: number, newValue: number) {
    return (oldValue === 0) ? 0 : ((newValue - oldValue) / oldValue) * 100;
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Pipe({
  name: 'duration'
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