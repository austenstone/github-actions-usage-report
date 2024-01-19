import { Component, Input } from '@angular/core';
import { UsageReport } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-line-usage-time',
  templateUrl: './chart-line-usage-time.component.html',
  styleUrl: './chart-line-usage-time.component.scss'
})
export class ChartLineUsageTimeComponent {

  @Input() data!: UsageReport;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'line'
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
    let minutes = 0;
    this.options.series = [{
      type: 'line',
      name: 'Usage',
      data: this.data.lines.reduce((acc, line) => {
        minutes += line.quantity;
        acc.push([line.date, minutes]);
        return acc;
      }, [] as [Date, number][])
    }];
    this.options.subtitle = {
      text: `${this.data.days} days between ${this.data.startDate.toLocaleDateString('en-US')} and ${this.data.endDate.toLocaleDateString('en-US')}`,
    }
    this.updateFromInput = true;
  }
}
