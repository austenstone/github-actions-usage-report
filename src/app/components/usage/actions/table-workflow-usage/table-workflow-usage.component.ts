import { AfterViewInit, Component, Input, OnChanges, ViewChild, Pipe, PipeTransform, SimpleChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService, WorkflowUsageItem, RepoUsageItem, SkuUsageItem, UserUsageItem, UsageColumn, AggregatedUsageData, AggregationType, Product } from 'src/app/usage-report.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-table-workflow-usage',
    templateUrl: './table-workflow-usage.component.html',
    styleUrl: './table-workflow-usage.component.scss',
    standalone: false
})
export class TableWorkflowUsageComponent implements OnChanges, AfterViewInit {
  baseColumns = [] as UsageColumn[];
  monthColumns = [] as UsageColumn[];
  columns = [] as UsageColumn[];
  displayedColumns: string[] = [];
  @Input() currency!: 'minutes' | 'cost';
  @Input() tableType!: AggregationType;
  @Input() product: Product | Product[] = 'actions';
  @Input() filter: string = '';
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem | UserUsageItem> = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter'] && !changes['filter'].isFirstChange()) {
      this.dataSource.filter = this.filter.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      return;
    }
    this.initializeColumns();

    // Use the service to get aggregated data
    this.usageReportService.getAggregatedUsageData(this.tableType, this.product).subscribe((aggregatedData: AggregatedUsageData) => {
      // Create month columns using the service helper method
      this.monthColumns = this.usageReportService.createMonthColumns(aggregatedData.availableMonths, this.currency, this.dataSource);
      this.updateMonthColumnFormatting();
      
      // Combine base columns with month columns and sort them properly
      const allColumns = [...this.baseColumns, ...this.monthColumns];
      this.columns = allColumns.sort((a, b) => {
        // Keep non-date columns first, then sort date columns chronologically
        if (!a.date && !b.date) return 0;
        if (!a.date) return -1;
        if (!b.date) return 1;
        return a.date.getTime() - b.date.getTime();
      });
      
      this.displayedColumns = this.columns.map(c => c.columnDef);
      this.dataSource.data = aggregatedData.items;
    });
  }

  private updateMonthColumnFormatting() {
    this.monthColumns.forEach(column => {
      // Update cell formatting based on currency
      column.cell = (workflowItem: any) => 
        this.currency === 'cost' 
          ? currencyPipe.transform(workflowItem[column.columnDef]) 
          : decimalPipe.transform(workflowItem[column.columnDef]);
      
      // Update footer formatting
      const originalFooter = column.footer;
      column.footer = () => {
        const total = originalFooter ? originalFooter() : 0;
        return this.currency === 'cost' 
          ? currencyPipe.transform(total) 
          : decimalPipe.transform(total);
      };

      // Add tooltip and icon functionality for percentage changes
      const month = column.columnDef;
      column.tooltip = (workflowItem: any) => {
        const percentChange = workflowItem[month + 'PercentChange'];
        return percentChange !== undefined ? percentChange.toFixed(2) + '%' : '';
      };
      
      column.icon = (workflowItem: any) => {
        const percentageChanged = workflowItem[month + 'PercentChange'];
        if (percentageChanged > 0) {
          return 'trending_up';
        } else if (percentageChanged < 0) {
          return 'trending_down';
        } else {
          return 'trending_flat';
        }
      };
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    const initial = this.dataSource.sortData;
    this.dataSource.sortData = (data: (WorkflowUsageItem | RepoUsageItem | SkuUsageItem | UserUsageItem)[], sort: MatSort) => {
      switch (sort.active) {
        case 'sku':
          return data.sort((a, b) => {
            const skuA = 'sku' in a ? a.sku : '';
            const skuB = 'sku' in b ? b.sku : '';
            const orderA = this.usageReportService.skuOrder.indexOf(skuA);
            const orderB = this.usageReportService.skuOrder.indexOf(skuB);
            return sort.direction === 'asc' ? orderA - orderB : orderB - orderA;
          });
        default:
          return initial(data, sort);
      }
    };
  }

  initializeColumns() {
    let columns: UsageColumn[] = [];
    if (this.tableType === 'workflow') {
      columns = [
        {
          columnDef: 'workflow',
          header: 'Workflow',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.workflowName}`,
          sticky: true,
        },
        {
          columnDef: 'repositoryName',
          header: 'Repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repositoryName}`,
        },
        {
          columnDef: 'runner',
          header: 'Runner Type',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.sku}`,
        },
      ];
    } else if (this.tableType === 'repositoryName') {
      columns = [
        {
          columnDef: 'repositoryName',
          header: 'Repository',
          cell: (workflowItem: WorkflowUsageItem) => `${workflowItem.repositoryName}`,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'sku') {
      columns = [
        {
          columnDef: 'sku',
          header: 'Runner',
          cell: (workflowItem: WorkflowUsageItem) => this.usageReportService.formatSku(workflowItem.sku),
          sticky: true,
        },
      ];
    } else if (this.tableType === 'username') {
      columns = [
        {
          columnDef: 'username',
          header: 'User',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.username,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'organization') {
      columns = [
        {
          columnDef: 'organization',
          header: 'Organization',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.organization,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'costCenterName') {
      columns = [
        {
          columnDef: 'costCenterName',
          header: 'Cost Center',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.costCenterName,
          sticky: true,
        },
      ];
    } else if (this.tableType === 'workflowPath') {
      columns = [
        {
          columnDef: 'workflowPath',
          header: 'Workflow Path',
          cell: (workflowItem: WorkflowUsageItem) => workflowItem.workflowPath,
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
        footer: () => {
          const avgTime = this.dataSource.data.reduce((acc: number, line: any) => acc + line.avgTime, 0) / this.dataSource.data.length;
          return durationPipe.transform(avgTime);
        }
      }, {
        columnDef: 'total',
        header: 'Total',
        cell: (workflowItem: WorkflowUsageItem) => decimalPipe.transform(Math.floor(workflowItem.total)),
        footer: () => {
          const total = this.dataSource.data.reduce((acc: number, line: any) => acc + line.total, 0);
          return decimalPipe.transform(total);
        }
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'avgCost',
        header: 'Avg run',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.avgCost),
        footer: () => {
          const avgCost = this.dataSource.data.reduce((acc: number, line: any) => acc + line.cost, 0) / this.dataSource.data.length;
          return currencyPipe.transform(avgCost);
        }
      }, {
        columnDef: 'cost',
        header: 'Total',
        cell: (workflowItem: WorkflowUsageItem) => currencyPipe.transform(workflowItem.cost),
        footer: () => {
          const total = this.dataSource.data.reduce((acc: number, line: any) => acc + line.cost, 0);
          return currencyPipe.transform(total);
        }
      });
    }
    columns[0].footer = () => 'Total';
    this.baseColumns = columns;
    this.monthColumns = []; // Reset month columns
    this.displayedColumns = this.baseColumns.map(c => c.columnDef);
  }
}

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