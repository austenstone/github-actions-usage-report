import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService } from 'src/app/usage-report.service';

interface WorkflowUsageItem {
  workflow: string;
  cost: number;
  avgTime: number;
  avgCost: number;
  runs: number;
  repo: string;
  total: number;
  runner: string;
  pricePerUnit: number;
};


interface RepoUsageItem {
  repo: string;
  cost: number;
  runs: number;
  total: number;
};

interface SkuUsageItem {
  sku: string;
  cost: number;
  runs: number;
  total: number;
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
  }[];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: UsageReportLine[];
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property
  tableType: string = 'workflow';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.initializeColumns();
    let usage: WorkflowUsageItem[] | RepoUsageItem[] | SkuUsageItem[] = [];
    if (this.tableType === 'workflow') {
      let workflowUsage: WorkflowUsageItem[] = (usage as WorkflowUsageItem[]);
      workflowUsage = this.data.filter(a => a.actionsWorkflow).reduce((acc, line) => {
        const workflowItem = acc.find(a => a.workflow === line.actionsWorkflow);
        const date = new Date(line.date);
        const month: string = date.toLocaleString('default', { month: 'long' });
        if (workflowItem) {
          if ((workflowItem as any)[month]) {
            (workflowItem as any)[month] += line.quantity || 0;
          } else {
            (workflowItem as any)[month] = line.quantity || 0;
          }
          workflowItem.total += line.quantity || 0;
          if (!this.columns.find(c => c.columnDef === month)) {
            this.columns.push({
              columnDef: month,
              header: month,
              cell: (workflowItem: any) => `${workflowItem[month]}`,
            });
            this.displayedColumns = this.columns.map(c => c.columnDef);
          }
          workflowItem.runs++;
        } else {
          acc.push({
            workflow: line.actionsWorkflow,
            repo: line.repositorySlug,
            total: line.quantity || 0,
            runs: 1,
            runner: this.usageReportService.formatSku(line.sku),
            pricePerUnit: line.pricePerUnit || 0,
            cost: line.quantity * line.pricePerUnit || 0,
            avgCost: line.quantity * line.pricePerUnit || 0,
            avgTime: line.quantity || 0,
            [month]: line.quantity || 0
          });
        }
        return acc;
      }, [] as WorkflowUsageItem[]);

      workflowUsage.forEach((workflowItem) => {
        this.columns.forEach((column: any) => {
          if (!(workflowItem as any)[column.columnDef]) {
            (workflowItem as any)[column.columnDef] = 0;
          }
        });
        workflowItem.avgTime = workflowItem.total / workflowItem.runs;
        workflowItem.cost = workflowItem.total * workflowItem.pricePerUnit;
        workflowItem.avgCost = workflowItem.avgTime * workflowItem.pricePerUnit;
      });
      usage = workflowUsage;
    } else if (this.tableType === 'repo') {
      let repoUsage: RepoUsageItem[] = (usage as RepoUsageItem[]);
      repoUsage = this.data.filter(a => a.actionsWorkflow).reduce((acc, line) => {
        const repoItem = acc.find(a => a.repo === line.repositorySlug);
        if (repoItem) {
          repoItem.total += line.quantity || 0;
          repoItem.runs++;
          repoItem.cost += line.quantity * line.pricePerUnit || 0;
        } else {
          acc.push({
            repo: line.repositorySlug,
            total: line.quantity || 0,
            runs: 1,
            cost: line.quantity * line.pricePerUnit || 0,
          });
        }
        return acc;
      }, [] as RepoUsageItem[]);
      usage = repoUsage;
    } else if (this.tableType === 'sku') {
      let skuUsage: SkuUsageItem[] = (usage as SkuUsageItem[]);
      skuUsage = this.data.filter(a => a.actionsWorkflow).reduce((acc, line) => {
        const repoItem = acc.find(a => a.sku === line.sku);
        if (repoItem) {
          repoItem.total += line.quantity || 0;
          repoItem.runs++;
          repoItem.cost += line.quantity * line.pricePerUnit || 0;
        } else {
          acc.push({
            sku: line.sku,
            total: line.quantity || 0,
            runs: 1,
            cost: line.quantity * line.pricePerUnit || 0,
          });
        }
        return acc;
      }, [] as SkuUsageItem[]);
      usage = skuUsage;
    }

    console.log('+', usage);
    this.dataSource.data = usage;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onTableTypeChange(tableType: string) {
    this.tableType = tableType;
    this.ngOnChanges();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  initializeColumns() {
    if (this.tableType === 'workflow') {
      this.columns = [
        {
          columnDef: 'workflow',
          header: 'Workflow',
          cell: (workflowItem: any) => `${workflowItem.workflow}`,
        },
        {
          columnDef: 'repo',
          header: 'Source repository',
          cell: (workflowItem: any) => `${workflowItem.repo}`,
        },
        {
          columnDef: 'runs',
          header: 'Workflow Runs',
          cell: (workflowItem: any) => `${workflowItem.runs}`,
        },
        {
          columnDef: 'runner',
          header: 'Runner Type',
          cell: (workflowItem: any) => `${workflowItem.runner}`,
        },
        {
          columnDef: 'avgTime',
          header: 'Average time',
          cell: (workflowItem: any) => `${durationPipe.transform(workflowItem.avgTime)}`,
        },
        {
          columnDef: 'avgCost',
          header: 'Average run cost',
          cell: (workflowItem: any) => `$${workflowItem.avgCost.toFixed(3)}`,
        },
        {
          columnDef: 'total',
          header: 'Total minutes',
          cell: (workflowItem: any) => Math.floor(workflowItem.total),
        },
      ];
    } else if (this.tableType === 'repo') {
      this.columns = [
        {
          columnDef: 'repo',
          header: 'Source repository',
          cell: (workflowItem: any) => `${workflowItem.repo}`,
        },
        {
          columnDef: 'runs',
          header: 'Workflow Runs',
          cell: (workflowItem: any) => `${workflowItem.runs}`,
        },
        {
          columnDef: 'total',
          header: 'Total minutes',
          cell: (workflowItem: any) => Math.floor(workflowItem.total),
        },
        {
          columnDef: 'cost',
          header: 'Total cost',
          cell: (workflowItem: any) => `$${workflowItem.cost.toFixed(3)}`,
        }
      ];
    } else if (this.tableType === 'sku') {
      this.columns = [
        {
          columnDef: 'sku',
          header: 'Runner Type',
          cell: (workflowItem: any) => `${this.usageReportService.formatSku(workflowItem.sku)}`,
        },
        {
          columnDef: 'runs',
          header: 'Workflow Runs',
          cell: (workflowItem: any) => `${workflowItem.runs}`,
        },
        {
          columnDef: 'total',
          header: 'Total minutes',
          cell: (workflowItem: any) => Math.floor(workflowItem.total),
        },
        {
          columnDef: 'cost',
          header: 'Total cost',
          cell: (workflowItem: any) => `$${workflowItem.cost.toFixed(3)}`,
        }
      ];
    }
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

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