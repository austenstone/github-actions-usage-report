import { AfterViewInit, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

interface UsageColumn {
  columnDef: string;
  header: string;
  cell: (element: any) => any;
  footer?: () => any;
  sticky?: boolean;
}

interface CopilotUsageItem {
  runs: number;
  total: number;
  cost: number;
  pricePerUnit: number;
  owner: string;
  sticky?: boolean;
}

@Component({
  selector: 'app-table-copilot-usage',
  templateUrl: './table-copilot-usage.component.html',
  styleUrl: './table-copilot-usage.component.scss'
})
export class TableCopilotUsageComponent implements OnChanges, AfterViewInit {
  columns = [] as UsageColumn[];
  displayedColumns = this.columns.map(c => c.columnDef);
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  dataSource: MatTableDataSource<CopilotUsageItem> = new MatTableDataSource<any>(); // Initialize the dataSource property
  tableType = 'owner';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usageReportService: UsageReportService,
  ) { }

  ngOnChanges() {
    this.initializeColumns();
    let usage: CopilotUsageItem[] = [];
    let usageItems: CopilotUsageItem[] = (usage as CopilotUsageItem[]);
    usageItems = this.data.reduce((acc, line) => {
      const item = acc.find(a => {
        if (this.tableType === 'owner') {
          return a.owner === line.organization;
        }
        return false;
      });
      const month: string = line.date.toLocaleString('default', { month: 'short' });
      if (item) {
        if ((item as any)[month]) {
          (item as any)[month] += line.value;
        } else {
          (item as any)[month] = line.value || 0;
        }
        item.total += line.value;
        if (!this.columns.find(c => c.columnDef === month)) {
          this.columns.push({
            columnDef: month,
            header: month,
            cell: (workflowItem: any) => this.currency === 'cost' ? currencyPipe.transform(workflowItem[month]) : decimalPipe.transform(workflowItem[month]),
            footer: () => {
              const total = this.dataSource.data.reduce((acc, item) => acc + (item as any)[month], 0);
              return this.currency === 'cost' ? currencyPipe.transform(total) : decimalPipe.transform(total);
            }
          });
        }
        item.cost += line.quantity * line.pricePerUnit;
        item.total += line.quantity;
        item.runs++;
      } else {
        acc.push({
          owner: line.organization,
          total: line.quantity,
          cost: line.quantity * line.pricePerUnit,
          runs: 1,
          pricePerUnit: line.pricePerUnit || 0,
          [month]: line.value,
        });
      }
      return acc;
    }, [] as CopilotUsageItem[]);

    usageItems.forEach((item) => {
      this.columns.forEach((column: any) => {
        if (!(item as any)[column.columnDef]) {
          (item as any)[column.columnDef] = 0;
        }
      });
    });
    usage = usageItems
    this.displayedColumns = this.columns.map(c => c.columnDef);
    this.dataSource.data = usage;
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
    if (this.tableType === 'owner') {
      columns = [
        {
          columnDef: 'owner',
          header: 'Owner',
          cell: (workflowItem: CopilotUsageItem) => `${workflowItem.owner}`,
          sticky: true
        }
      ];
      if (this.currency === 'minutes') {
        columns.push({
          columnDef: 'total',
          header: 'Total seats',
          cell: (workflowItem: CopilotUsageItem) => decimalPipe.transform(Math.floor(workflowItem.total)),
          footer: () => decimalPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
        });
      } else if (this.currency === 'cost') {
        columns.push({
          columnDef: 'cost',
          header: 'Total cost',
          cell: (workflowItem: CopilotUsageItem) => currencyPipe.transform(workflowItem.cost),
          footer: () => currencyPipe.transform(this.data.reduce((acc, line) => acc += line.value, 0))
        });
      }
    }
    // columns[0].footer = () => 'Total';
    this.columns = columns;
    this.displayedColumns = this.columns.map(c => c.columnDef);
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

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

const decimalPipe = new DecimalPipe('en-US');
const currencyPipe = new CurrencyPipe('en-US');