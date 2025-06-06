import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../material.module';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsageComponent } from './components/usage/usage.component';
import { FileUploadComponent } from './components/usage/file-upload/file-upload.component';
import { ChartPieUserComponent } from './components/usage/actions/charts/chart-pie-user/chart-pie-user.component';
import { TableWorkflowUsageComponent } from './components/usage/actions/table-workflow-usage/table-workflow-usage.component';

import { HighchartsChartModule } from 'highcharts-angular';
import { ChartBarTopTimeComponent } from './components/usage/actions/charts/chart-bar-top-time/chart-bar-top-time.component';
import { ChartLineUsageDailyComponent } from './components/usage/actions/charts/chart-line-usage-daily/chart-line-usage-daily.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ChartPieSkuComponent } from './components/usage/actions/charts/chart-pie-sku/chart-pie-sku.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActionsComponent } from './components/usage/actions/actions.component';
import { SharedStorageComponent } from './components/usage/shared-storage/shared-storage.component';
import { TableSharedStorageComponent } from './components/usage/shared-storage/table-shared-storage/table-shared-storage.component';
import { LineUsageTimeComponent } from './components/usage/shared-storage/charts/line-usage-time/line-usage-time.component';
import { CopilotComponent } from './components/usage/copilot/copilot.component';
import { DialogBillingNavigateComponent } from './components/usage/dialog-billing-navigate';
import { TableCopilotUsageComponent } from './components/usage/copilot/table-workflow-usage/table-copilot-usage.component';
import { CodespacesComponent } from './components/usage/codespaces/codespaces.component';
import { TableCodespacesUsageComponent } from './components/usage/codespaces/table-codespaces-usage/table-codespaces-usage.component';

@NgModule({ declarations: [
        AppComponent,
        UsageComponent,
        ChartPieUserComponent,
        ChartLineUsageDailyComponent,
        ChartBarTopTimeComponent,
        TableWorkflowUsageComponent,
        ChartPieSkuComponent,
        ActionsComponent,
        SharedStorageComponent,
        FileUploadComponent,
        TableSharedStorageComponent,
        LineUsageTimeComponent,
        DialogBillingNavigateComponent,
        CopilotComponent,
        TableCopilotUsageComponent,
        CodespacesComponent,
        TableCodespacesUsageComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        MaterialModule,
        BrowserAnimationsModule,
        HighchartsChartModule,
        FormsModule,
        ReactiveFormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
