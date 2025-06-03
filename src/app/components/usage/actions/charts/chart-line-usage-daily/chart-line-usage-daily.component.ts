import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';

@Component({
    selector: 'app-chart-line-usage-daily',
    templateUrl: './chart-line-usage-daily.component.html',
    styleUrl: './chart-line-usage-daily.component.scss',
    standalone: false
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
  chartType: 'repo' | 'total' | 'sku' | 'user' | 'workflow' = 'sku';
  timeType: 'total' | 'run' | 'daily' | 'weekly' | 'monthly' | 'rolling30' | 'rolling7' = 'rolling30';
  rollingDays = 30;

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
    this.rollingDays = Number(this.timeType.split('rolling')[1]);
    const seriesDays = this.data.reduce(
      (acc, line, index) => {
        let name = 'Total';
        let timeKey = 'total';
        if (this.timeType === 'run') {
          timeKey = `${line.workflowName}${line.date}${index}`;
        } else if (this.timeType === 'daily') {
          timeKey = line.date.toISOString().split('T')[0];
        } else if (this.timeType === 'weekly') {
          timeKey = this.getWeekOfYear(line.date).toString();
        } else if (this.timeType === 'monthly') {
          // get key in format YYYY-MM
          timeKey = line.date.toISOString().split('T')[0].slice(0, 7);
        } else if (this.timeType.startsWith('rolling')) {
          // get key in format YYYY-MM
          timeKey = line.date.toISOString().split('T')[0];
        } else if (this.timeType === 'total') {
          timeKey = 'total'
        }
        if (this.chartType === 'sku') {
          name = this.usageReportService.formatSku(line.sku);
        } else if (this.chartType === 'user') {
          name = line.username;
        } else if (this.chartType === 'repo') {
          name = line.repositoryName;
        } else if (this.chartType === 'workflow') {
          name = line.workflowName;
        } else if (this.chartType === 'total') {
          name = 'total';
        }
        const series = acc.find((s) => s.name === name);
        if (series) {
          if (!series.data[timeKey]) series.data[timeKey] = [];
          if (timeKey === 'total') {
            const last = series.data[timeKey][series.data[timeKey].length - 1];
            series.data[timeKey].push([line.date.getTime(), (last[1] + line.value)]);
          } else if (this.timeType.startsWith('rolling')) {
            series.data[timeKey].push([line.date.getTime(), line.value]);
          } else {
            series.data[timeKey].push([line.date.getTime(), line.value]);
          }
          series.total += line.value;
        } else {
          acc.push({
            name,
            data: {
              [timeKey]: [[line.date.getTime(), line.value]]
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
      } else if (this.timeType.startsWith('rolling')) {
        const perDay = Object.keys(series.data).reduce((acc, timeKey) => {
          acc.push({
            total: series.data[timeKey].reduce((acc, curr) => acc + curr[1], 0),
            date: new Date(timeKey)
          });
          return acc;
        }, [] as {
          total: number;
          date: Date;
        } []);

        data = perDay.reduce((acc, curr, index) => {
          acc.push([
            curr.date.getTime(),
            perDay.slice(index > this.rollingDays ? index - this.rollingDays : 0, index).reduce((acc, curr) => acc + curr.total, 0)
          ]);
          return acc;
        }, [] as [number, number][]);
      } else {
        data = Object.keys(series.data).reduce((acc, timeKey) => {
          acc.push([
            new Date(series.data[timeKey][0][0]).getTime(),
            series.data[timeKey].reduce((acc, curr) => acc + curr[1], 0)
          ]);
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
      text: `Actions ${this.currency === 'cost' ? 'Cost' : 'Usage'} ${this.timeType.toUpperCase()}`
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
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }
}
