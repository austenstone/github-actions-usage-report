import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-chart-line-usage-daily',
  templateUrl: './chart-line-usage-daily.component.html',
  styleUrl: './chart-line-usage-daily.component.scss'
})
export class ChartLineUsageDailyComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  @ViewChild('chart') chartRef!: any;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'spline',
      zooming: {
        type: 'x'
      }
    },
    title: {
      text: 'Actions Usage Daily'
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
            month: '%e. %b',
            year: '%b'
        },
        title: {
            text: 'Date'
        }
    },
    series: [],
    legend: {
      align: 'right',
      verticalAlign: 'top',
      layout: 'vertical',
      y: 0,
    },
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
    const seriesDays = this.data.reduce(
      (acc, line) => {
        const day = line.date.toISOString().split('T')[0];
        let name = 'Total';
        if (this.chartType === 'sku') {
          name = this.usageReportService.formatSku(line.sku);
        } else if (this.chartType === 'user') {
          name = line.username;
        } else if (this.chartType === 'repo') {
          name = line.repositorySlug;
        }
        const series = acc.find((s) => s.name === name);
        if (series) {
          if (!series.data[day]) series.data[day] = [];
          series.data[day].push([new Date(line.date).getTime(), line.value]);
          series.total += line.value;
        } else {
          acc.push({
            name,
            data: {
              [day]: [[new Date(line.date).getTime(), line.value]]
            },
            total: line.value
          });
        }
        return acc;
      },
      [] as { name: string; data: { [key: string]: [number, number][] }, total: number }[]
    ).sort((a: any, b: any) => {
      return b.total - a.total;
    }).slice(0, 50);
    (this.options.series as { name: string; data: [number, number][] }[]) = seriesDays.map((series) => {
      return {
        name: series.name,
        data: Object.keys(series.data).reduce((acc, day) => {
          acc.push([new Date(day).getTime(), series.data[day].reduce((acc, curr) => acc + curr[1], 0)]);
          return acc;
        }, [] as [number, number][]).sort((a, b) => a[0] - b[0])
      }
    });
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
