import { Component, Input } from '@angular/core';
import { UsageReport } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-line-usage-daily',
  templateUrl: './chart-line-usage-daily.component.html',
  styleUrl: './chart-line-usage-daily.component.scss'
})
export class ChartLineUsageDailyComponent {
  @Input() data!: UsageReport;
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
    }]
  };
  updateFromInput: boolean = false;

  ngOnChanges() {
    this.data.lines = this.data.lines.filter((line) => line.unitType === 'minute');
    const daily = this.data.lines.reduce((acc, line) => {
      const date = new Date(line.date);
      const day = date.toISOString().split('T')[0]; // get the day in YYYY-MM-DD format
    
      if (!acc[day]) {
        acc[day] = [date.getTime(), line.quantity];
      } else {
        acc[day][1] += line.quantity;
      }
  
      return acc;
    }, {} as {[key: string]: [number, number]});
    
    this.options.series = [{
      type: 'line',
      name: 'Usage',
      data: Object.values(daily)
    }];
  
    this.options.subtitle = {
      text: `${this.data.days} days between ${this.data.startDate.toLocaleDateString('en-US')} and ${this.data.endDate.toLocaleDateString('en-US')}`,
    }
    this.updateFromInput = true;
  }
}
