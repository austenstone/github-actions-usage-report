import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../material.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogOverviewExampleDialog, UsageComponent } from './components/usage/usage.component';
import { FileUploadComponent } from './components/usage/file-upload/file-upload.component';
import { ChartPieUserComponent } from './components/usage/actions/charts/chart-pie-user/chart-pie-user.component';
import { ChartLineUsageTimeComponent } from './components/usage/actions/charts/chart-line-usage-time/chart-line-usage-time.component';
import { TableWorkflowUsageComponent } from './components/usage/actions/table-workflow-usage/table-workflow-usage.component';

import { HighchartsChartModule } from 'highcharts-angular';
import { ChartBarTopTimeComponent } from './components/usage/actions/charts/chart-bar-top-time/chart-bar-top-time.component';
import { ChartLineUsageDailyComponent } from './components/usage/actions/charts/chart-line-usage-daily/chart-line-usage-daily.component';
import { HttpClientModule } from '@angular/common/http';
import { ChartPieSkuComponent } from './components/usage/actions/charts/chart-pie-sku/chart-pie-sku.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionsUsageComponent } from './components/usage/actions/actions.component';
import { SharedStorageComponent } from './components/usage/shared-storage/shared-storage.component';
import { TableSharedStorageComponent } from './components/usage/shared-storage/table-shared-storage/table-shared-storage.component';
import { LineUsageTimeComponent } from './components/usage/shared-storage/charts/line-usage-time/line-usage-time.component';

@NgModule({
  declarations: [
    AppComponent,
    UsageComponent,
    ChartPieUserComponent,
    ChartLineUsageTimeComponent,
    ChartLineUsageDailyComponent,
    ChartBarTopTimeComponent,
    TableWorkflowUsageComponent,
    ChartPieSkuComponent,
    ActionsUsageComponent,
    SharedStorageComponent,
    FileUploadComponent,
    TableSharedStorageComponent,
    LineUsageTimeComponent,
    DialogOverviewExampleDialog
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    BrowserAnimationsModule,
    HighchartsChartModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
