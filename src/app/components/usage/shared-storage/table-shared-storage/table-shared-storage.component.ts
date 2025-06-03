import { Component, Input, Pipe, PipeTransform, ViewChild, OnChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { CustomUsageReportLine } from 'src/app/usage-report.service';
import { CurrencyPipe } from '@angular/common';

type SharedStorageUsageItem = {
  repo: string;
  count: number;
  avgSize: number;
  total: number;
  totalCost: number;
  avgCost: number;
  pricePerUnit: number;
  costPerDay: number;
};

@Component({
  selector: 'app-table-shared-storage',
  templateUrl: './table-shared-storage.component.html',
  styleUrl: './table-shared-storage.component.scss'
})
export class TableSharedStorageComponent implements OnChanges, AfterViewInit {
  columns: {
    columnDef: string;
    header: string;
    cell: (element: SharedStorageUsageItem) => any;
    footer?: () => any;
    sticky?: boolean;
  }[] = [];
  displayedColumns: string[] = [];
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  dataSource: MatTableDataSource<SharedStorageUsageItem> = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private cdr: ChangeDetectorRef) {
    this.initializeColumns();
  }

  ngOnChanges() {
    if (!this.data) {
      return; // Avoid processing if data is not available yet
    }
    
    this.initializeColumns();
    
    const workflowUsage = this.data.reduce((acc, line) => {
      const workflowEntry = acc.find(a => a.repo === line.repositoryName);
      const date = line.date;
      const month: string = date.toLocaleString('default', { month: 'short' });
      const cost = line.quantity * line.pricePerUnit;
      if (workflowEntry) {
        if ((workflowEntry as any)[month] as any) {
          (workflowEntry as any)[month] += line.value;
        } else {
          (workflowEntry as any)[month] = line.value;
        }
        if (!this.columns.find(c => c.columnDef === month)) {
          this.columns.push({
            columnDef: month,
            header: month,
            cell: (sharedStorageItem: any) => this.currency === 'cost' ? currencyPipe.transform(sharedStorageItem[month]) : fileSizePipe.transform(sharedStorageItem[month]),
            footer: () => {
              if (!this.dataSource?.data) return '';
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : fileSizePipe.transform(total);
            }
          });
        }
        workflowEntry.total += line.quantity;
        workflowEntry.totalCost += cost;
        workflowEntry.count++;
        workflowEntry.costPerDay = cost;
      } else {
        acc.push({
          repo: line.repositoryName,
          total: line.quantity,
          count: 1,
          totalCost: cost,
          avgSize: 0,
          avgCost: 0,
          [month]: line.value,
          pricePerUnit: line.pricePerUnit,
          costPerDay: cost
        });
      }
      return acc;
    }, [] as SharedStorageUsageItem[]);

    workflowUsage.forEach((sharedStorageItem: SharedStorageUsageItem) => {
      this.columns.forEach((column) => {
        if (!(sharedStorageItem as any)[column.columnDef]) {
          (sharedStorageItem as any)[column.columnDef] = 0;
        }
        sharedStorageItem.avgSize = sharedStorageItem.total / sharedStorageItem.count;
        sharedStorageItem.avgCost = sharedStorageItem.totalCost / sharedStorageItem.count;
      });
    });

    // Update displayedColumns first
    this.displayedColumns = this.columns.map(c => c.columnDef);
    
    // Then update the data source
    this.dataSource = new MatTableDataSource<SharedStorageUsageItem>(workflowUsage);
    
    // Apply sort and pagination immediately, without setTimeout
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    
    // Mark for check to ensure proper change detection
    this.cdr.markForCheck();
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
      cell: (sharedStorageItem: SharedStorageUsageItem) => any,
      footer?: () => any,
      sticky?: boolean
    }[] = [
        {
          columnDef: 'repo',
          header: 'Repository',
          cell: (sharedStorageItem: any) => sharedStorageItem.repo,
          footer: () => 'Total',
          sticky: true
        },
        {
          columnDef: 'count',
          header: 'Count',
          cell: (sharedStorageItem: any) => sharedStorageItem.count,
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
          cell: (sharedStorageItem: any) => currencyPipe.transform(sharedStorageItem.totalCost),
          footer: () => {
            if (!this.dataSource?.data) return '';
            return currencyPipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.totalCost, 0));
          }
        },
        {
          columnDef: 'costPerDay',
          header: 'Cost Per Day',
          cell: (sharedStorageItem: SharedStorageUsageItem) => currencyPipe.transform(sharedStorageItem.costPerDay),
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
          cell: (sharedStorageItem: any) => fileSizePipe.transform(sharedStorageItem.avgSize),
          footer: () => {
            if (!this.dataSource?.data || this.dataSource.data.length === 0) return '';
            return fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.avgSize, 0) / this.dataSource.data.length);
          },
        },
        {
          columnDef: 'total',
          header: 'Total',
          cell: (sharedStorageItem: any) => fileSizePipe.transform(sharedStorageItem.total),
          footer: () => {
            if (!this.dataSource?.data) return '';
            return fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.total, 0));
          },
        }
      );
    }
    this.columns = columns;
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
  name: 'formatFileSize'
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
