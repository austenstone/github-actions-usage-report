import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../material.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsageComponent } from './components/usage/usage.component';
import { UsageTableComponent } from './components/usage-table/usage-table.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { ChartPieUserComponent } from './components/charts/chart-pie-user/chart-pie-user.component';
import { ChartLineUsageTimeComponent } from './components/charts/chart-line-usage-time/chart-line-usage-time.component';
import { TableWorkflowUsageComponent } from './components/table-workflow-usage/table-workflow-usage.component';

import { HighchartsChartModule } from 'highcharts-angular';
import { ChartBarTopTimeComponent } from './components/charts/chart-bar-top-time/chart-bar-top-time.component';
import { ChartLineUsageDailyComponent } from './components/charts/chart-line-usage-daily/chart-line-usage-daily.component';
import { HttpClientModule } from '@angular/common/http';
import { ChartPieSkuComponent } from './components/charts/chart-pie-sku/chart-pie-sku.component';

@NgModule({
  declarations: [
    AppComponent,
    UsageComponent,
    UsageTableComponent,
    FileUploadComponent,
    ChartPieUserComponent,
    ChartLineUsageTimeComponent,
    ChartLineUsageDailyComponent,
    ChartBarTopTimeComponent,
    TableWorkflowUsageComponent,
    ChartPieSkuComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    HighchartsChartModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
