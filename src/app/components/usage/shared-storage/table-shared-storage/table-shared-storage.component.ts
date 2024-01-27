import { Component, Input, Pipe, PipeTransform, ViewChild, OnChanges, AfterViewInit } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
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
  cost: number;
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
  }[] = [];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  dataSource: MatTableDataSource<SharedStorageUsageItem> = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges() {
    this.initializeColumns();
    const workflowUsage = this.data.reduce((acc, line) => {
      const workflowEntry = acc.find(a => a.repo === line.repositorySlug);
      const date = line.date;
      const month: string = date.toLocaleString('default', { month: 'long' });
      if (workflowEntry) {
        if (workflowEntry[month]) {
          workflowEntry[month] += line.quantity;
        } else {
          workflowEntry[month] = line.quantity;
        }
        workflowEntry.total += line.quantity;
        if (!this.columns.find(c => c.columnDef === month)) {
          this.columns.push({
            columnDef: month,
            header: month,
            cell: (sharedStorageItem: any) => this.currency === 'cost' ? currencyPipe.transform(sharedStorageItem[month]) : fileSizePipe.transform(sharedStorageItem[month]),
            footer: () => {
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : fileSizePipe.transform(total);
            }
          });
        }
        workflowEntry.count++;
        workflowEntry.cost += line.pricePerUnit * line.quantity * line.multiplier;
      } else {
        acc.push({
          repo: line.repositorySlug,
          total: line.quantity,
          count: 1,
          cost: line.pricePerUnit * line.quantity * line.multiplier,
          avgSize: 0,
          avgCost: 0,
          [month]: line.value
        });
      }
      return acc;
    }, [] as any[]);

    workflowUsage.forEach((sharedStorageItem: any) => {
      this.columns.forEach((column: any) => {
        if (!sharedStorageItem[column.columnDef]) {
          sharedStorageItem[column.columnDef] = 0;
        }
        sharedStorageItem.avgSize = sharedStorageItem.total / sharedStorageItem.count;
        sharedStorageItem.avgCost = sharedStorageItem.cost / sharedStorageItem.count;
      });
    });

    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource ? this.dataSource.data = workflowUsage : this.dataSource = new MatTableDataSource();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  initializeColumns() {
    let columns: {
      columnDef: string,
      header: string,
      cell: (sharedStorageItem: SharedStorageUsageItem) => any,
      footer?: () => any,
    }[] = [
        {
          columnDef: 'repo',
          header: 'Repository',
          cell: (sharedStorageItem: any) => `${sharedStorageItem.repo}`,
          footer: () => 'Total',
        },
        {
          columnDef: 'count',
          header: 'Artifact Count',
          cell: (sharedStorageItem: any) => `${sharedStorageItem.count}`,
          footer: () => this.dataSource.data.reduce((acc, line) => acc + line.count, 0),
        }
      ];
    if (this.currency == 'cost') {
      columns.push(
        {
          columnDef: 'total',
          header: 'Cost/Day',
          cell: (sharedStorageItem: any) => `$${sharedStorageItem.cost.toFixed(2)}`,
          footer: () => `$${this.dataSource.data.reduce((acc, line) => acc + line.cost, 0).toFixed(2)}`,
        }
      );
    } else if (this.currency == 'minutes') {
      columns.push(
        {
          columnDef: 'avgSize',
          header: 'Average Size',
          cell: (sharedStorageItem: any) => `${fileSizePipe.transform(sharedStorageItem.avgSize)}`,
          footer: () => fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.avgSize, 0) / this.dataSource.data.length),
        },
        {
          columnDef: 'total',
          header: 'Total',
          cell: (sharedStorageItem: any) => `${fileSizePipe.transform(sharedStorageItem.total)}`,
          footer: () => fileSizePipe.transform(this.dataSource.data.reduce((acc, line) => acc + line.total, 0)),
        }
      );
    }
    this.columns = columns;
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
