import { Input } from '@angular/core';
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import { UsageReportLine } from 'github-usage-report/types';

/**
 * @title Table with pagination
 */
@Component({
  selector: 'app-usage-table',
  templateUrl: './usage-table.component.html',
  styleUrls: ['./usage-table.component.scss'],
})
export class UsageTableComponent implements AfterViewInit {
  displayedColumns: string[] = [
    'actionsWorkflow',
    'date',
    'multiplier',
    'notes',
    'owner',
    'pricePerUnit',
    'product',
    'quantity',
    'repositorySlug',
    'sku',
    'unitType',
    'username'
  ];
  @Input() data!: UsageReportLine[];
  dataSource: MatTableDataSource<UsageReportLine> = new MatTableDataSource<any>(); // Initialize the dataSource property

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit() {
    console.log(this.data);
    this.dataSource.data = this.data.slice(undefined, 10000);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
}
