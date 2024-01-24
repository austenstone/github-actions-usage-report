import { Component, Input, OnChanges } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-pie-user',
  templateUrl: './chart-pie-user.component.html',
  styleUrls: ['./chart-pie-user.component.scss']
})
export class ChartPieUserComponent implements OnChanges {
  @Input() data!: UsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Usage by username'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br>Minutes: <b>{point.y}</b>'
    },
    series: [{
      type: 'pie', // Add the type property
      name: 'Usage',
      data: [
        ['Jane', 1],
        ['John', 2],
        ['Joe', 3]
      ]
    }]
  };
  updateFromInput: boolean = false;

  ngOnChanges() {
    this.data = this.data.filter((line) => line.unitType === 'minute');
    this.options.series = [{
      type: 'pie', // Add the type property
      name: 'Usage',
      data: this.data.reduce((acc, line) => {
        const index = acc.findIndex((item) => item[0] === line.username);
        if (index === -1) {
          acc.push([line.username, line.quantity]);
        } else {
          acc[index][1] += line.quantity;
        }
        return acc;
      }, [] as [string, number][]).sort((a, b) => b[1] - a[1])
    }];
    this.updateFromInput = true;
  }
  
}
