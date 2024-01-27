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
  chartType: 'repo' | 'total' | 'sku' | 'user' | 'workflow' = 'total';
  timeType: 'total' | 'daily' | 'weekly' | 'monthly' | 'rolling20' = 'total';

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
        let name = 'Total';
        let timeKey = 'total';
        if (this.timeType === 'daily') {
          timeKey = line.date.toISOString().split('T')[0];
        } else if (this.timeType === 'weekly') {
          timeKey = this.getWeekOfYear(line.date).toString();
        } else if (this.timeType === 'monthly') {
          // get key in format YYYY-MM
          timeKey = line.date.toISOString().split('T')[0].slice(0, 7);
        } else if (this.timeType === 'rolling20') {
        } else if (this.timeType === 'total') {
          timeKey = 'total'
        }
        if (this.chartType === 'sku') {
          name = this.usageReportService.formatSku(line.sku);
        } else if (this.chartType === 'user') {
          name = line.username;
        } else if (this.chartType === 'repo') {
          name = line.repositorySlug;
        } else if (this.chartType === 'workflow') {
          name = line.actionsWorkflow;
        } else if (this.chartType === 'total') {
          name = 'total';
        }
        const series = acc.find((s) => s.name === name);
        if (series) {
          if (!series.data[timeKey]) series.data[timeKey] = [];
          if (timeKey === 'total') {
            const last = series.data[timeKey][series.data[timeKey].length - 1];
            series.data[timeKey].push([new Date(line.date).getTime(), (last[1] + line.value)]);
          } else {
            series.data[timeKey].push([new Date(line.date).getTime(), line.value]);
          }
          series.total += line.value;
        } else {
          acc.push({
            name,
            data: {
              [timeKey]: [[new Date(line.date).getTime(), line.value]]
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
      let data: [number, number][] = [];
      if (this.timeType === 'total') {
        data = series.data['total'];
      } else {
        data = Object.keys(series.data).reduce((acc, timeKey) => {
          acc.push([new Date(series.data[timeKey][0][0]).getTime(), series.data[timeKey].reduce((acc, curr) => acc + curr[1], 0)]);
          return acc;
        }, [] as [number, number][]);
      }
      return {
        name: series.name,
        data
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
    this.options.title = {
      text: `Actions Usage ${this.timeType.toUpperCase()}`
    };
    this.updateFromInput = true;
  }

  redrawChart() {
    this.chartRef.ngOnDestroy();
    this.ngOnChanges();
  }

  getWeekOfYear(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
  }
}
