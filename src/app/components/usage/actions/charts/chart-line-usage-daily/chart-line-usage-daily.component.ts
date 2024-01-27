import { Component, Input, OnChanges } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
  selector: 'app-chart-line-usage-daily',
  templateUrl: './chart-line-usage-daily.component.html',
  styleUrl: './chart-line-usage-daily.component.scss'
})
export class ChartLineUsageDailyComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'line',
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
            // don't display the year
            month: '%e. %b',
            year: '%b'
        },
        title: {
            text: 'Date'
        }
    },
    series: [{
      type: 'line', // Add the type property
      name: 'Usage',
      data: [
      ]
    }],
    legend: {
      enabled: false
    }
  };
  updateFromInput: boolean = false;

  constructor(
    private themeService: ThemingService
  ) {
    this.options = {
      ...this.options,
      ...this.themeService.getHighchartsOptions(),
    }
  }

  ngOnChanges() {
    this.data = this.data.filter((line) => line.unitType === 'minute');
    const daily = this.data.reduce((acc, line) => {
      const date = new Date(line.date);
      const day = date.toISOString().split('T')[0]; // get the day in YYYY-MM-DD format
    
      if (!acc[day]) {
        acc[day] = [date.getTime(), line.value];
      } else {
        acc[day][1] += line.value;
      }
  
      return acc;
    }, {} as {[key: string]: [number, number]});
    
    this.options.series = [{
      type: 'line',
      name: 'Usage',
      data: Object.values(daily)
    }];
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
}
