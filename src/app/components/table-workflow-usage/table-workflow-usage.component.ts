import { Component, Input, ViewChild } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-table-workflow-usage',
  templateUrl: './table-workflow-usage.component.html',
  styleUrl: './table-workflow-usage.component.scss'
})
export class TableWorkflowUsageComponent {
  columns = [
    {
      columnDef: 'workflow',
      header: 'Workflow',
      cell: (workflowItem: any) => `${workflowItem.workflow}`,
    },
    {
      columnDef: 'total',
      header: 'Total',
      cell: (workflowItem: any) => `${workflowItem.total}`,
    }
  ];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: UsageReport;
  dataSource: MatTableDataSource<UsageReportLine> = new MatTableDataSource<any>(); // Initialize the dataSource property

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    const workflowUsage = this.data.lines.filter(a => a.actionsWorkflow).reduce((acc, line) => {
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
            cell: (cost: any) => `${cost[month]}`,
          });
          this.displayedColumns = this.columns.map(c => c.columnDef);
        }
      } else {
        acc.push({
          workflow: line.actionsWorkflow,
          repo: line.repositorySlug,
          total: line.quantity || 0,
          [month]: line.quantity || 0
        });
      }
      return acc; // Add this line to return the accumulator
    }, [] as any[]);
    // fill in undefined months in workflowUsage
    workflowUsage.forEach((workflowItem: any) => {
      this.columns.forEach((column: any) => {
        if (!workflowItem[column.columnDef]) {
          workflowItem[column.columnDef] = 0;
        }
      });
    });
    this.dataSource = new MatTableDataSource(workflowUsage);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
