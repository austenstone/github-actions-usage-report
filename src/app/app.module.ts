import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../material.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsageComponent } from './usage/usage.component';
import { UsageTableComponent } from './usage-table/usage-table.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ChartPieOwnerComponent } from './chart-pie-owner/chart-pie-owner.component';
import { ChartLineUsageTimeComponent } from './chart-line-usage-time/chart-line-usage-time.component';

import { HighchartsChartModule } from 'highcharts-angular';

@NgModule({
  declarations: [
    AppComponent,
    UsageComponent,
    UsageTableComponent,
    FileUploadComponent,
    ChartPieOwnerComponent,
    ChartLineUsageTimeComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    HighchartsChartModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
