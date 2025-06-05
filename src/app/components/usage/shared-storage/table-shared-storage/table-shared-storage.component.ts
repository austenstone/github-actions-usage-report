import { Component, Input, Pipe, PipeTransform, ViewChild, OnChanges, AfterViewInit, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { AggregatedUsageData, AggregationType, CustomUsageReportLine, Product, RepoUsageItem, SkuUsageItem, UsageColumn, UsageReportService, UserUsageItem, WorkflowUsageItem } from 'src/app/usage-report.service';
import { CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-table-shared-storage',
    templateUrl: './table-shared-storage.component.html',
    styleUrl: './table-shared-storage.component.scss',
    standalone: false
})
export class TableSharedStorageComponent implements OnChanges, AfterViewInit {
  displayedColumns: string[] = [];
  @Input() data!: CustomUsageReportLine[];
  @Input() tableType: AggregationType = 'repositoryName';
  @Input() currency!: 'minutes' | 'cost';
  @Input() product: Product | Product[] = 'actions';
  dataSource: MatTableDataSource<WorkflowUsageItem | RepoUsageItem | SkuUsageItem | UserUsageItem> = new MatTableDataSource<any>();
  baseColumns = [] as UsageColumn[];
  monthColumns = [] as UsageColumn[];
  columns = [] as UsageColumn[];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges) {
        // if (changes['filter'] && !changes['filter'].isFirstChange()) {
        //   this.dataSource.filter = this.filter.trim().toLowerCase();
    
        //   if (this.dataSource.paginator) {
        //     this.dataSource.paginator.firstPage();
        //   }
        //   return;
        // }
        this.initializeColumns();
    
        // Use the service to get aggregated data
        this.usageReportService.getAggregatedUsageData(this.tableType, this.product).subscribe((aggregatedData: AggregatedUsageData) => {
          // Create month columns using the service helper method
          this.monthColumns = this.usageReportService.createMonthColumns(aggregatedData.availableMonths, this.currency, this.dataSource);
          // this.updateMonthColumnFormatting();
          
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

        return;
    // if (!this.data) {
    //   return; // Avoid processing if data is not available yet
    // }
    
    // this.initializeColumns();
    
    // const workflowUsage = this.data.reduce((acc, line) => {
    //   const workflowEntry = acc.find(a => a.repositoryName === line.repositoryName);
    //   const date = line.date;
    //   const month: string = date.toLocaleString('default', { month: 'short' });
    //   const cost = line.quantity * line.pricePerUnit;
    //   if (workflowEntry) {
    //     if ((workflowEntry as any)[month] as any) {
    //       (workflowEntry as any)[month] += line.value;
    //     } else {
    //       (workflowEntry as any)[month] = line.value;
    //     }
    //     if (!this.columns.find(c => c.columnDef === month)) {
    //       this.columns.push({
    //         columnDef: month,
    //         header: month,
    //         cell: (sharedStorageItem: WorkflowUsageItem) => this.currency === 'cost' ? currencyPipe.transform(sharedStorageItem[month]) : fileSizePipe.transform(sharedStorageItem[month]),
    //         footer: () => {
    //           if (!this.dataSource?.data) return '';
    //           const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
    //           return this.currency === 'cost' ? currencyPipe.transform(total) : fileSizePipe.transform(total);
    //         }
    //       });
    //     }
    //     workflowEntry.total += line.quantity;
    //     workflowEntry.totalCost += cost;
    //     workflowEntry.count++;
    //     workflowEntry.costPerDay = cost;
    //   } else {
    //     acc.push({
    //       repositoryName: line.repositoryName,
    //       total: line.quantity,
    //       count: 1,
    //       totalCost: cost,
    //       avgSize: 0,
    //       avgCost: 0,
    //       [month]: line.value,
    //       pricePerUnit: line.pricePerUnit,
    //       costPerDay: cost,
    //       avgTime: 0,
    //       workflowPath: line.workflowPath || '',
    //       date: line.date
    //     });
    //   }
    //   return acc;
    // }, [] as WorkflowUsageItem[]);

    // workflowUsage.forEach((sharedStorageItem: WorkflowUsageItem) => {
    //   this.columns.forEach((column) => {
    //     if (!(sharedStorageItem as any)[column.columnDef]) {
    //       (sharedStorageItem as any)[column.columnDef] = 0;
    //     }
    //     sharedStorageItem.avgSize = sharedStorageItem.total / sharedStorageItem.count;
    //     sharedStorageItem.avgCost = sharedStorageItem.totalCost / sharedStorageItem.count;
    //   });
    // });

    // // Update displayedColumns first
    // this.displayedColumns = this.columns.map(c => c.columnDef);
    
    // // Then update the data source
    // this.dataSource = new MatTableDataSource<WorkflowUsageItem>(workflowUsage);
    
    // // Apply sort and pagination immediately, without setTimeout
    // if (this.sort) {
    //   this.dataSource.sort = this.sort;
    // }
    // if (this.paginator) {
    //   this.dataSource.paginator = this.paginator;
    // }
    
    // // Mark for check to ensure proper change detection
    // this.cdr.markForCheck();
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

  initializeColumns() {
    const columns: {
      columnDef: string,
      header: string,
      cell: (sharedStorageItem: WorkflowUsageItem) => any,
      footer?: () => any,
      sticky?: boolean
    }[] = [
        {
          columnDef: 'repositoryName',
          header: 'Repository',
          cell: (sharedStorageItem: WorkflowUsageItem) => sharedStorageItem.repositoryName,
          footer: () => 'Total',
          sticky: true
        },
        {
          columnDef: 'count',
          header: 'Count',
          cell: (sharedStorageItem: WorkflowUsageItem) => sharedStorageItem.count,
          footer: () => {
            if (!this.dataSource?.data) return '';
            return this.dataSource.data.reduce((acc, line) => acc + line.count, 0);
          },
        }
      ];
    if (this.currency == 'cost') {
      columns.push(
        {
          columnDef: 'total',
          header: 'Total Cost',
          cell: (sharedStorageItem: WorkflowUsageItem) => currencyPipe.transform(sharedStorageItem.total),
          footer: () => {
            if (!this.dataSource?.data) return '';
            return currencyPipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.total, 0));
          }
        },
        {
          columnDef: 'costPerDay',
          header: 'Cost Per Day',
          cell: (sharedStorageItem: WorkflowUsageItem) => currencyPipe.transform(sharedStorageItem.costPerDay),
          footer: () => {
            if (!this.dataSource?.data) return '';
            return currencyPipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.costPerDay, 0));
          },
        }
      );
    } else if (this.currency == 'minutes') {
      columns.push(
        {
          columnDef: 'avgSize',
          header: 'Average Size',
          cell: (sharedStorageItem: WorkflowUsageItem) => fileSizePipe.transform(sharedStorageItem.avgSize),
          footer: () => {
            if (!this.dataSource?.data || this.dataSource.data.length === 0) return '';
            return fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.avgSize, 0) / this.dataSource.data.length);
          },
        },
        {
          columnDef: 'total',
          header: 'Total',
          cell: (sharedStorageItem: WorkflowUsageItem) => fileSizePipe.transform(sharedStorageItem.total),
          footer: () => {
            if (!this.dataSource?.data) return '';
            return fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.total, 0));
          },
        }
      );
    }
    this.baseColumns = columns;
    this.monthColumns = []; // Reset month columns
    // Update displayedColumns immediately after updating columns
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

type unit = 'bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
type unitPrecisionMap = {
  [u in unit]: number;
};

const defaultPrecisionMap: unitPrecisionMap = {
  bytes: 0,
  KB: 0,
  MB: 1,
  GB: 1,
  TB: 2,
  PB: 2
};

@Pipe({
    name: 'formatFileSize',
    standalone: false
})
export class FormatFileSizePipe implements PipeTransform {
  private readonly units: unit[] = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  transform(gbs: number = 0, precision: number | unitPrecisionMap = defaultPrecisionMap): string {
    let bytes = gbs * 1073741824;
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) return '?';

    let unitIndex = 0;

    while (bytes >= 1024) {
      bytes /= 1024;
      unitIndex++;
    }

    const unit = this.units[unitIndex];

    if (typeof precision === 'number') {
      return `${bytes.toFixed(+precision)}\xa0${unit}`;
    }
    return `${bytes.toFixed(precision[unit])}\xa0${unit}`;
  }
}

const fileSizePipe = new FormatFileSizePipe();
const currencyPipe = new CurrencyPipe('en-US');
