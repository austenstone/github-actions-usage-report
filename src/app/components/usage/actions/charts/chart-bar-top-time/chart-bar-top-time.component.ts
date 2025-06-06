import { Component, Input, OnChanges } from '@angular/core';
import * as Highcharts from 'highcharts';
import { ThemingService } from 'src/app/theme.service';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
    selector: 'app-chart-bar-top-time',
    templateUrl: './chart-bar-top-time.component.html',
    styleUrl: './chart-bar-top-time.component.scss',
    standalone: false
})
export class ChartBarTopTimeComponent implements OnChanges {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: string;
  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options = {
    chart: {
      type: 'bar'
    },
    title: {
      text: 'Top 10 repos by minutes used'
    },
    subtitle: {
    },
    yAxis: {
        title: {
            text: 'Minutes (min)'
        },
    },
    xAxis: {
        title: {
        
        }
    },
    series: [{
      type: 'bar',
      name: 'Usage',
      data: [
        { name: 'Point 1', y: 1 },
        { name: 'Point 2', y: 2 },
        { name: 'Point 3', y: null },
        { name: 'Point 4', y: 4 }
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
    this.data = this.data.filter((line) => line.unitType === 'minutes');
    this.options.series = [{
      type: 'bar',
      name: 'Usage',
      data: this.data.reduce((acc, line) => {
        const existingItem = acc.find((a) => a.name === line.repositoryName);
        if (existingItem) {
          existingItem.y += line.value;
        } else {
          acc.push({ name: line.repositoryName, y: line.value });
        }
        return acc;
      }, [] as { name: string, y: number }[]).sort((a, b) => b.y - a.y).slice(0, 10)
    }];
    this.options.xAxis = {
      ...this.options.xAxis,
      categories: (this.options.series[0] as any).data.map((a: any) => a.name),
    };
    this.options.title = {
      text: this.currency === 'minutes' ? 'Top 10 repos by minutes used' : 'Top 10 repos by cost'
    };
    this.options.yAxis = {
      ...this.options.yAxis,
      title: {
        text: this.currency === 'minutes' ? 'Minutes (min)' : 'Cost (USD)'
      },
      labels: {
        format: this.currency === 'cost' ? '${value}' : '{value}',
      }
    };
    this.options.tooltip = {
      format: `{point.name}</b><br>${this.currency === 'cost' ? '$<b>{point.y:.2f}</b>' : '<b>{point.y}</b> mins'}`,
    };
    this.updateFromInput = true;
  }
}
