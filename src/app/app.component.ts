import { Component } from '@angular/core';
import ExportingModule from 'highcharts/modules/exporting';
import SunsetTheme from 'highcharts/themes/sunset.js';
import * as Highcharts from "highcharts";

// The modules will work for all charts.
ExportingModule(Highcharts);
// SunsetTheme(Highcharts);

Highcharts.setOptions({
  chart: {
    backgroundColor: 'transparent',
  },
  title: {
    style: {
      color: '#000',
      font: '24px Roboto, sans-serif'
    }
  },
  subtitle: {
    style: {
      color: '#666666',
      font: '14px Roboto, sans-serif'
    }
  },
  legend: {
    itemStyle: {
      font: '9pt Roboto, sans-serif',
      color: 'black'
    },
    itemHoverStyle: {
      color: 'gray'
    }
  }
})

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
