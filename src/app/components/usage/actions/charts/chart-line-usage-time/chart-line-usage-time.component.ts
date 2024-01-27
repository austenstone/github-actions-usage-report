import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-chart-line-usage-time',
  templateUrl: './chart-line-usage-time.component.html',
  styleUrl: './chart-line-usage-time.component.scss'
})
export class ChartLineUsageTimeComponent implements OnChanges {
  @Input() currency!: string;
  @Input() data!: CustomUsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
  @ViewChild('chart') chartRef!: any;
  options: Highcharts.Options = {
    chart: {
      type: 'spline',
      zooming: {
        type: 'x'
      }
    },
    title: {
      text: 'Actions Usage Over Time'
    },
    subtitle: {
    },
    yAxis: {
      title: {
        text: 'Minutes (min)'
      },
      min: 0
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        // don't display the year
        month: '%e. %b',
        year: '%b'
      },
      title: {
        text: 'Date'
      }
    },
    legend: {
      align: 'right',
      verticalAlign: 'top',
      layout: 'vertical',
      y: 0,
    },
    series: []
  };
  updateFromInput: boolean = false;
  chartType: 'repo' | 'total' | 'sku' | 'user' = 'total';

  constructor(
    private themeService: ThemingService,
    private usageReportService: UsageReportService
  ) {
    this.options = {
      ...this.options,
      ...this.themeService.getHighchartsOptions(),
    }
  }

  ngOnChanges() {
    let minutes = 0;    
    (this.options.series as any) = this.data.reduce(
      (acc, line) => {
        let name = 'Total';
        if (this.chartType === 'total') {
          name = 'Total';
        } else if (this.chartType === 'repo') {
          name = line.repositorySlug;
        } else if (this.chartType === 'sku') {
          name = this.usageReportService.formatSku(line.sku);
        } else if (this.chartType === 'user') {
          name = line.username;
        }
        minutes += line.value;
        if (acc.find(a => a.name === name)) {
          const existing = acc.find(a => a.name === name);
          if (existing) {
            existing?.data.push([new Date(line.date).getTime(), existing.data[existing.data.length - 1][1] + line.value]);
          }
        } else {
          acc.push({
            name: name,
            data: [
              [new Date(line.date).getTime(), line.value]
            ]
          });
        }
        return acc;
      },
      [] as { name: string; data: [number, number][] }[]
    ).sort((a: any, b: any) => {
      return b.data[b.data.length - 1][1] - a.data[a.data.length - 1][1];
    }).slice(0, 50);
    if (this.options.legend) this.options.legend.enabled = this.chartType === 'total' ? false : true;
    this.options.yAxis = {
      ...this.options.yAxis,
      title: {
        text: this.currency === 'minutes' ? 'Minutes (min)' : 'Cost (USD)'
      },
      labels: {
        format: this.currency === 'cost' ? '${value}' : '{value}',
      }
    };
    this.updateFromInput = true;
  }

  toggleChartType(value: string) {
    (this.chartType as string) = value;
    this.chartRef.ngOnDestroy();
    this.ngOnChanges();
  }

}
