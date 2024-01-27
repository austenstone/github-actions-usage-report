import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
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
};

interface RepoUsageItem {
  avgTime: number;
  avgCost: number;
  repo: string;
  runs: number;
  total: number;
  cost: number;
};

interface SkuUsageItem {
  avgTime: number;
  avgCost: number;
  sku: string;
  runs: number;
  total: number;
  cost: number;
};

@Component({
  selector: 'app-table-workflow-usage',
  templateUrl: './table-workflow-usage.component.html',
  styleUrl: './table-workflow-usage.component.scss'
})
export class TableWorkflowUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as {
    columnDef: string;
    header: string;
    cell: (element: any) => any;
    footer?: () => any;
  }[];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property
  tableType: 'workflow' | 'repo' | 'sku' | 'user' = 'workflow';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.initializeColumns();
    let usage: WorkflowUsageItem[] | RepoUsageItem[] | SkuUsageItem[] = [];
    let usageItem: WorkflowUsageItem[] = (usage as WorkflowUsageItem[]);
    usageItem = this.data.reduce((acc, line) => {
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
        return false;
      });
      const month: string = line.date.toLocaleString('default', { month: 'long' });
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
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : decimalPipe.transform(total);
            }
          });
        }
        item.cost += line.quantity * line.pricePerUnit * line.multiplier;
        item.total += line.quantity;
        item.runs++;
      } else {
        acc.push({
          workflow: line.actionsWorkflow,
          repo: line.repositorySlug,
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit * line.multiplier,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          avgCost: line.quantity * line.pricePerUnit * line.multiplier,
          avgTime: line.value,
          [month]: line.value,
          sku: this.usageReportService.formatSku(line.sku),
          username: line.username,
        });
      }
      return acc;
    }, [] as WorkflowUsageItem[]);

    usageItem.forEach((item) => {
      this.columns.forEach((column: any) => {
        if (!(item as any)[column.columnDef]) {
          (item as any)[column.columnDef] = 0;
        }
      });
      item.avgTime = item.total / item.runs;
      item.avgCost = item.cost / item.runs;
    });
    usage = usageItem;
    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource.data = usage;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  initializeColumns() {
    let columns: {
      columnDef: string,
      header: string,
      cell: (workflowItem: WorkflowUsageItem) => any,
      footer?: () => any,
    }[] = [];
    if (this.tableType === 'workflow') {
      columns = [
        {
          columnDef: 'workflow',
          header: 'Workflow',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.workflow}`,
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
        },
      ];
    } else if (this.tableType === 'sku') {
      columns = [
        {
          columnDef: 'sku',
          header: 'Runner Type',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.sku,
        },
      ];
    } else if (this.tableType === 'user') {
      columns = [
        {
          columnDef: 'username',
          header: 'User',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.username,
        },
      ];
    };
    columns.push({
        columnDef: 'runs',
        header: 'Runs',
        cell: (workflowItem: WorkflowUsageItem) => `${decimalPipe.transform(workflowItem.runs)}`,
        footer: () => {
          const total = this.dataSource.data.reduce((acc, item) => acc + item.runs, 0);
          return decimalPipe.transform(total);
        }
      });
    if (this.currency === 'minutes') {
      columns.push({
        columnDef: 'avgTime',
        header: 'Average time',
        cell: (workflowItem: WorkflowUsageItem) => `${durationPipe.transform(workflowItem.avgTime)}`,
        footer: () => durationPipe.transform(this.dataSource.data.reduce((acc, line) => acc += line.avgTime, 0) / this.dataSource.data.length)
      }, {
        columnDef: 'total',
        header: 'Total minutes',
        cell: (workflowItem: WorkflowUsageItem) => decimalPipe.transform(Math.floor(workflowItem.total)),
        footer: () => decimalPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'avgCost',
        header: 'Average run cost',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.avgCost),
        footer: () => currencyPipe.transform(this.dataSource.data.reduce((acc, line) => acc += line.cost, 0) / this.dataSource.data.length)
      }, {
        columnDef: 'cost',
        header: 'Total cost',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.cost),
        footer: () => currencyPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
      });
    }
    columns[0].footer = () => 'Total';
    this.columns = columns;
    this.displayedColumns = this.columns.map(c => c.columnDef);
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