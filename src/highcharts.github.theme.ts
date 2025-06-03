import * as Highcharts from 'highcharts';

const tooltipHeaderFormat =
  '<table><tr><th style="color: var(--mat-sys-on-surface-variant); font-weight: 600; padding-bottom: 2px">{point.key}</th></tr>';

const tooltipPointFormat =
  '<tr><td style="padding: 0.25rem;"><span style="color:{point.color}">●</span> {series.name}: <strong>{point.y}</strong></td></tr>';

const tooltipFooterFormat = '</table>';

const xAxisConfig: Highcharts.XAxisOptions = {
  tickWidth: 0,
  lineWidth: 0,
  gridLineColor: 'var(--mat-sys-outline)',
  gridLineDashStyle: 'Dot',
  // lineColor: 'var(--mat-sys-outline)',
  labels: {
    style: {
      color: 'var(--mat-sys-on-surface)',
      font: 'var(--mat-sys-body-large)'
    }
  },
  title: {
    text: undefined,
    style: {
      color: 'var(--mat-sys-on-surface-variant)',
      font: 'var(--mat-sys-body-large)'
    }
  },
  lineColor: 'var(--mat-sys-outline-variant)',
  tickColor: 'var(--mat-sys-outline-variant)'
};

const yAxisConfig: Highcharts.YAxisOptions = {
  // Same config as xAxis but with YAxis type
  ...xAxisConfig
};

const theme: Highcharts.Options = {
  accessibility: {
    keyboardNavigation: {
      order: ['legend', 'series'],
    },
  },
  colors: [
    'var(--data-blue-color-emphasis, var(--data-blue-color))',
    'var(--data-green-color-emphasis, var(--data-green-color))',
    'var(--data-orange-color-emphasis, var(--data-orange-color))',
    'var(--data-pink-color-emphasis, var(--data-pink-color))',
    'var(--data-yellow-color-emphasis, var(--data-yellow-color))',
    'var(--data-red-color-emphasis, var(--data-red-color))',
    'var(--data-purple-color-emphasis, var(--data-purple-color))',
    'var(--data-auburn-color-emphasis, var(--data-auburn-color))',
    'var(--data-teal-color-emphasis, var(--data-teal-color))',
    'var(--data-gray-color-emphasis, var(--data-gray-color))',
  ],
  caption: {
    align: 'left',
    style: {
      color: 'var(--fgColor-muted)',
    },
    verticalAlign: 'top',
  },
  title: {
    align: 'left',
    style: {
      color: 'var(--fgColor-default)',
    },
    text: undefined,
  },
  subtitle: {
    align: 'left',
    style: {
      color: 'var(--fgColor-muted)',
      fontSize: 'var(--text-body-size-small)',
    },
  },
  tooltip: {
    backgroundColor: 'var(--bgColor-default)',
    borderRadius: 6,
    borderColor: 'var(--borderColor-muted)',
    borderWidth: 1,
    shape: 'rect',
    padding: 10,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      opacity: 0.02,
      width: 4,
      color: 'var(--shadowColor-default)',
    },
    style: {
      color: 'var(--fgColor-default)',
      fontFamily: 'var(--fontStack-sansSerif)',
      fontSize: 'var(--text-body-size-small)',
    },
    useHTML: true,
    headerFormat: tooltipHeaderFormat,
    pointFormat: tooltipPointFormat,
    footerFormat: tooltipFooterFormat,
  },
  credits: {
    enabled: false,
  },
  chart: {
    animation: false,
    events: {
      // afterA11yUpdate() {
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   const container = (this as any).container
      //   container?.setAttribute('role', 'application')
      // },
    },
    spacing: [4, 0, 4, 0],
    backgroundColor: 'var(--bgColor-default, var(--color-canvas-default))',
    style: {
      fontFamily: 'var(--fontStack-sansSerif)',
      fontSize: 'var(--text-body-size-small)',
      color: 'var(--fgColor-default)',
    },
    resetZoomButton: {
      theme: {
        fill: 'var(--bgColor-default)',
        stroke: 'var(--borderColor-default)',
        style: {
          color: 'var(--fgColor-default)',
          fontFamily: 'var(--fontStack-sansSerif)',
          fontSize: 'var(--text-body-size-small)',
          cursor: 'pointer',
          userSelect: 'none',
          minWidth: '64px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 24
        },
        states: {
          hover: {
            fill: 'var(--bgColor-muted)',
            style: {
              color: 'var(--fgColor-default)'
            }
          },
          select: {
            fill: 'var(--bgColor-emphasis)',
          }
        },
        paddingLeft: 12,
        paddingRight: 12,
        height: 24,
        r: 4
      },
      position: {
        align: 'right',
        verticalAlign: 'top',
        x: -10,
        y: 10
      }
    },
    width: null,
    height: null
  },
  legend: {
    itemStyle: {
      fontSize: 'var(--text-body-size-small)',
      font: 'var(--fontStack-sansSerif)',
      color: 'var(--fgColor-default)',
    },
    align: 'left',
    verticalAlign: 'top',
    x: -8,
    y: -12,
    itemHoverStyle: {
      color: 'var(--fgColor-default)',
    },
    title: {
      style: {
        color: 'var(--fgColor-default)',
      },
    },
  },
  navigation: {
    buttonOptions: {
      align: 'right',
      verticalAlign: 'top',
      theme: {
        fill: 'var(--mat-sys-surface-container)',
        stroke: 'var(--mat-sys-outline)',
        states: {
          hover: {
            fill: 'var(--mat-sys-surface-container-high)',
            style: {
              color: 'var(--mat-sys-on-surface)'
            }
          },
          select: {
            fill: 'var(--mat-sys-surface-container-highest)',
            style: {
              color: 'var(--mat-sys-on-surface)'
            }
          }
        },
      }
    } as Highcharts.NavigationButtonOptions,
    menuStyle: {
      background: 'var(--mat-sys-surface-container)',
      color: 'var(--mat-sys-on-surface)',
      border: '0px solid var(--mat-sys-outline)',
      borderRadius: 4,
      padding: '8px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 1000,
    },
    menuItemHoverStyle: {
      background: 'var(--mat-sys-surface-container-highest)',
      color: 'var(--mat-sys-on-surface)',
      cursor: 'pointer',
      transition: 'background 200ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    menuItemStyle: {
      color: 'var(--mat-sys-on-surface)',
      fontSize: '14px',
      padding: '8px 16px',
      fontFamily: 'var(--mat-sys-body-large-font)',
      fontWeight: 'var(--mat-sys-body-large-weight)',
      transition: 'background 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },
  exporting: {
    fallbackToExportServer: false,
    enabled: true,
    buttons: {
      contextButton: {
        symbol: 'menu',
        symbolStroke: 'var(--fgColor-default)',
        symbolStrokeWidth: 2,
        theme: {
          fill: 'var(--bgColor-default)',
          stroke: 'var(--borderColor-default)'
        },
      }
    },
    chartOptions: {
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            style: {
              fontSize: 'var(--text-body-size-small)',
              fontWeight: 'normal',
              textOutline: 'none'
            }
          }
        }
      }
    }
  },
  plotOptions: {
    series: {
      animation: false,
    },
    spline: {
      animation: false,
    },
    bar: {
      borderColor: 'var(--bgColor-default)',
    },
    column: {
      borderColor: 'var(--bgColor-default)',
      borderRadius: 2,
      borderWidth: 0
    },
    pie: {
      borderWidth: 0,
      borderRadius: 2,
      dataLabels: {
        style: {
          fontFamily: 'var(--fontStack-sansSerif)',
          color: 'var(--fgColor-default)',
          fontSize: 'var(--text-body-size-small)',
          fontWeight: 'normal',
          textOutline: 'none',
        },
        distance: 20,
        connectorWidth: 1,
        connectorColor: 'var(--borderColor-muted)'
      }
    }
  },
  xAxis: {
    tickWidth: 0,
    lineWidth: 1,
    gridLineColor: 'var(--borderColor-muted)',
    gridLineDashStyle: 'Dash',
    lineColor: 'var(--borderColor-default)',
    labels: {
      style: {
        color: 'var(--fgColor-muted)',
        fontSize: 'var(--text-body-size-small)',
      },
    },
    title: {
      style: {
        color: 'var(--fgColor-muted)',
        fontSize: 'var(--text-body-size-small)',
      },
    },
  },
  yAxis: [yAxisConfig],
  lang: {
    thousandsSep: ',',
  },
  drilldown: {
    breadcrumbs: {
      position: {
        align: 'right'
      },
      buttonTheme: {
        style: {
          color: 'var(--fgColor-accent)',
          fontFamily: 'var(--fontStack-sansSerif)',
          fontSize: 'var(--text-body-size-small)',
        },
        states: {
          hover: {
            fill: 'var(--bgColor-muted)',
            style: {
              color: 'var(--fgColor-default)'
            }
          },
          select: {
            style: {
              color: 'var(--fgColor-default)'
            }
          }
        }
      },
      separator: {
        style: {
          color: 'var(--fgColor-muted)',
        }
      }
    },
    activeAxisLabelStyle: {
      color: 'var(--fgColor-accent)',
      textDecoration: 'none',
      fontWeight: 'bold',
      textOutline: 'none',
      cursor: 'pointer'
    },
    activeDataLabelStyle: {
      color: 'var(--fgColor-accent)',
      textDecoration: 'none',
      fontWeight: 'bold',
      textOutline: 'none',
      cursor: 'pointer'
    },
  },
}
Highcharts.setOptions(theme);
