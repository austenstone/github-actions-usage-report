import { Component, OnInit } from '@angular/core';
import { ThemingService } from './theme.service';
import { UsageReportService } from './usage-report.service';
import ExportingModule from 'highcharts/modules/exporting';
import * as Highcharts from "highcharts";

ExportingModule(Highcharts);

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    logo!: string;
    constructor(
        private themeService: ThemingService,
        private usageReportService: UsageReportService,
    ) { }

    ngOnInit() {
        this.themeService.getTheme().subscribe(theme => {
            this.logo = this.themeService.getLogo();
        })
        this.usageReportService.getValueType().subscribe(valueType => {
            this.themeService.setHighchartsOptions({
                tooltip: {
                    pointFormat: `<b>{series.name}</b><br>${valueType === 'cost' ? '${point.y:.2f}' : '{point.y} mins'}`,
                }
            });
        });
    }
}
