import { AfterViewInit, Component, Input, OnChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService, UserUsageItem, UsageColumn, AggregatedUsageData } from 'src/app/usage-report.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

type Product = 'git_lfs' | 'packages' | 'copilot' | 'actions' | 'codespaces';

@Component({
    selector: 'app-table-copilot-usage',
    templateUrl: './table-copilot-usage.component.html',
    styleUrl: './table-copilot-usage.component.scss',
    standalone: false
})
export class TableCopilotUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  monthColumns = [] as UsageColumn[];
  displayedColumns: string[] = [];
  @Input() currency!: 'minutes' | 'cost';
  @Input() tableType: 'workflow' | 'repo' | 'sku' | 'user' = 'user'; // Copilot typically aggregates by user/organization
  @Input() product: Product | Product[] = 'copilot';
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
    private cdr: ChangeDetectorRef
  ) { 
    this.initializeColumns();
  }

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
      this.dataSource.data = aggregatedData.items as UserUsageItem[];
      
      // Mark for check to ensure proper change detection
      this.cdr.markForCheck();
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
    
    // Add the username column for user aggregation
    columns = [
      {
        columnDef: 'username',
        header: 'User',
        cell: (item: UserUsageItem) => `${item.username}`,
        sticky: true
      }
    ];
    
    if (this.currency === 'minutes') {
      columns.push({
        columnDef: 'total',
        header: 'Total seats',
        cell: (item: UserUsageItem) => decimalPipe.transform(Math.floor(item.total)),
        footer: () => {
          if (!this.dataSource?.data) return '';
          return decimalPipe.transform(this.dataSource.data.reduce((acc, item) => acc + item.total, 0));
        }
      });
    } else if (this.currency === 'cost') {
      columns.push({
        columnDef: 'cost',
        header: 'Total cost',
        cell: (item: UserUsageItem) => currencyPipe.transform(item.cost),
        footer: () => {
          if (!this.dataSource?.data) return '';
          return currencyPipe.transform(this.dataSource.data.reduce((acc, item) => acc + item.cost, 0));
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

const decimalPipe = new DecimalPipe('en-US');
const currencyPipe = new CurrencyPipe('en-US');