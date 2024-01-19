import { Component, Input } from '@angular/core';
import { UsageReportLine } from 'github-usage-report/types';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-chart-pie-owner',
  templateUrl: './chart-pie-owner.component.html',
  styleUrls: ['./chart-pie-owner.component.scss']
})
export class ChartPieOwnerComponent {
  @Input() data!: UsageReportLine[];
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Usage by Owner'
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
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
        const index = acc.findIndex((item) => item[0] === line.owner);
        if (index === -1) {
          acc.push([line.owner, line.quantity]);
        } else {
          acc[index][1] += line.quantity;
        }
        return acc;
      }, [] as [string, number][]).sort((a, b) => b[1] - a[1])
    }];
    this.updateFromInput = true;
  }
  
}
