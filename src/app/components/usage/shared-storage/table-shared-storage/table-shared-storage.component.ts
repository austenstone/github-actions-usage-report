import { Component, Input, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-table-shared-storage',
  templateUrl: './table-shared-storage.component.html',
  styleUrl: './table-shared-storage.component.scss'
})
export class TableSharedStorageComponent {
  columns = [
    {
      columnDef: 'repo',
      header: 'Source repository',
      cell: (workflowItem: any) => `${workflowItem.repo}`,
    },
    {
      columnDef: 'count',
      header: 'Artifact Count',
      cell: (workflowItem: any) => `${workflowItem.count}`,
    },
    {
      columnDef: 'avgSize',
      header: 'Average Size',
      cell: (workflowItem: any) => `${fileSizePipe.transform(workflowItem.avgSize)}`,
    },
    {
      columnDef: 'total',
      header: 'Total Gb',
      cell: (workflowItem: any) => `${fileSizePipe.transform(workflowItem.total)}`,
    },
    {
      columnDef: 'cost',
      header: 'Cost / Day',
      cell: (workflowItem: any) => `$${workflowItem.cost.toFixed(2)}`,
    },
  ];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: UsageReportLine[];
  dataSource: MatTableDataSource<UsageReportLine> = new MatTableDataSource<any>(); // Initialize the dataSource property

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
  ) { }

  ngOnInit() {
  }

  ngOnChanges() {
    const workflowUsage = this.data.reduce((acc, line) => {
      const workflowEntry = acc.find(a => a.repo === line.repositorySlug);
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
            cell: (workflowItem: any) => `${fileSizePipe.transform(workflowItem[month])}`,
          });
          this.displayedColumns = this.columns.map(c => c.columnDef);
        }
        workflowEntry.avgSize = workflowEntry.total / workflowEntry.count;
        workflowEntry.count++;
        workflowEntry.cost += line.pricePerUnit * (line.quantity || 0);
      } else {
        acc.push({
          repo: line.repositorySlug,
          total: line.quantity || 0,
          count: 1,
          cost: line.pricePerUnit * (line.quantity || 0),
          avgSize: line.quantity || 0,
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
    });

    this.dataSource? this.dataSource.data = workflowUsage : this.dataSource = new MatTableDataSource();
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