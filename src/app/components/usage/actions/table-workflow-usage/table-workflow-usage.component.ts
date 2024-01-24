import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-table-workflow-usage',
  templateUrl: './table-workflow-usage.component.html',
  styleUrl: './table-workflow-usage.component.scss'
})
export class TableWorkflowUsageComponent implements OnChanges, AfterViewInit {
  columns = [
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
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: UsageReportLine[];
  dataSource: MatTableDataSource<UsageReportLine> = new MatTableDataSource<any>(); // Initialize the dataSource property

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    const workflowUsage = this.data.filter(a => a.actionsWorkflow).reduce((acc, line) => {
      const workflowEntry = acc.find(a => a.workflow === line.actionsWorkflow);
      const date = new Date(line.date);
      const month: string = date.toLocaleString('default', { month: 'long' });
      if (workflowEntry) {
        if (workflowEntry[month]) {
          workflowEntry[month] += line.quantity || 0;
        } else {
          workflowEntry[month] = line.quantity || 0;
        }
        workflowEntry.total += line.quantity || 0;
        if (!this.columns.find(c => c.columnDef === month)) {
          this.columns.push({
            columnDef: month,
            header: month,
            cell: (workflowItem: any) => `${workflowItem[month]}`,
          });
          this.displayedColumns = this.columns.map(c => c.columnDef);
        }
        workflowEntry.runs++;
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
    }, [] as any[]);

    workflowUsage.forEach((workflowItem: any) => {
      this.columns.forEach((column: any) => {
        if (!workflowItem[column.columnDef]) {
          workflowItem[column.columnDef] = 0;
        }
      });
      workflowItem.avgTime = workflowItem.total / workflowItem.runs;
      workflowItem.cost = workflowItem.total * workflowItem.pricePerUnit;
      workflowItem.avgCost = workflowItem.avgTime * workflowItem.pricePerUnit;
    });

    this.dataSource ? this.dataSource.data = workflowUsage : this.dataSource = new MatTableDataSource();
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