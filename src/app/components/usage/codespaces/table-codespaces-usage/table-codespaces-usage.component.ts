import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService, WorkflowUsageItem, RepoUsageItem, SkuUsageItem, UserUsageItem, UsageColumn, AggregatedUsageData, AggregationType } from 'src/app/usage-report.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

type Product = 'git_lfs' | 'packages' | 'copilot' | 'actions' | 'codespaces';

@Component({
    selector: 'app-table-codespaces-usage',
    templateUrl: './table-codespaces-usage.component.html',
    styleUrl: './table-codespaces-usage.component.scss',
    standalone: false
})
export class TableCodespacesUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  monthColumns = [] as UsageColumn[];
  displayedColumns: string[] = [];
  @Input() currency!: 'minutes' | 'cost';
  @Input() tableType!: AggregationType;
  @Input() product: Product | Product[] = 'codespaces';
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem | UserUsageItem> = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.initializeColumns();
    
    // Use the service to get aggregated data
    this.usageReportService.getAggregatedUsageData(this.tableType, this.product).subscribe((aggregatedData: AggregatedUsageData) => {
      // Create month columns using the service helper method
      this.monthColumns = this.usageReportService.createMonthColumns(aggregatedData.availableMonths, this.currency, this.dataSource);
      this.updateMonthColumnFormatting();
      this.columns = [...this.columns, ...this.monthColumns];
      this.columns = this.columns.sort((a, b) => (!a.date || !b.date) ? 0 : a.date.getTime() - b.date.getTime()); 
      this.displayedColumns = this.columns.map(c => c.columnDef);
      this.dataSource.data = aggregatedData.items;
    });
  }

  private updateMonthColumnFormatting() {
    this.monthColumns.forEach(column => {
      // Update cell formatting based on currency
      column.cell = (item: any) => 
        this.currency === 'cost' 
          ? currencyPipe.transform(item[column.columnDef]) 
          : decimalPipe.transform(item[column.columnDef]);
      
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
      column.tooltip = (item: any) => {
        const percentChange = item[month + 'PercentChange'];
        return percentChange !== undefined ? percentChange.toFixed(2) + '%' : '';
      };
      
      column.icon = (item: any) => {
        const percentageChanged = item[month + 'PercentChange'];
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
    if (this.tableType === 'sku') {
      columns = [
        {
          columnDef: 'sku',
          header: 'Product',
          cell: (item: SkuUsageItem) => `${item.sku}`,
          sticky: true
        }
      ];
    } else if (this.tableType === 'repositoryName') {
      columns = [
        {
          columnDef: 'repo',
          header: 'Repository',
          cell: (item: RepoUsageItem) => `${item.repositoryName}`,
          sticky: true
        }
      ];
    } else if (this.tableType === 'username') {
      columns = [
        {
          columnDef: 'username',
          header: 'User',
          cell: (item: UserUsageItem) => `${item.username}`,
          sticky: true
        }
      ];
    }
    
    if (this.currency === 'minutes') {
      columns.push({
        columnDef: 'total',
        header: 'Total hours',
        cell: (item: any) => decimalPipe.transform(Math.floor(item.total)),
        footer: () => {
          if (!this.dataSource?.data) return '';
          const total = this.dataSource.data.reduce((acc: number, item: any) => acc + (item.total || 0), 0);
          return decimalPipe.transform(total);
        }
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'cost',
        header: 'Total cost',
        cell: (item: any) => currencyPipe.transform(item.cost),
        footer: () => {
          if (!this.dataSource?.data) return '';
          const total = this.dataSource.data.reduce((acc: number, item: any) => acc + (item.cost || 0), 0);
          return currencyPipe.transform(total);
        }
      });
    }
    
    this.columns = columns;
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

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