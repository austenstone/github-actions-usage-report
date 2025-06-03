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
export const colors = (style: string = 'emphasis') => [
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
  `var()`,
]
const theme: Highcharts.Options = {
  colors: [
    'var(--mat-sys-primary)',
    'var(--mat-sys-secondary)',
    'var(--mat-sys-tertiary)',
    'var(--mat-sys-primary-container)',
    'var(--mat-sys-secondary-container)',
    'var(--mat-sys-tertiary-container)',
    'var(--mat-sys-inverse-primary)',
    'var(--mat-sys-error)',
    'var(--mat-sys-on-error)'
  ],
  chart: {
    backgroundColor: undefined, // 'var(--mat-sys-surface)',
    borderRadius: 16,
    style: {
      fontFamily: 'var(--mat-sys-body-large-font)'
    },
    animation: {
      duration: 300
    },
    spacing: [20, 20, 20, 20],
    resetZoomButton: {
      theme: {
        fill: 'var(--mdc-filled-button-container-color)',
        stroke: 'none',
        style: {
          color: 'var(--mdc-filled-button-label-text-color)',
          font: 'var(--mdc-filled-button-label-text-font, var(--mat-app-label-large-font))',
          fontSize: 'var(--mdc-filled-button-label-text-size)',
          letterSpacing: 'var(--mdc-filled-button-label-text-tracking)',
          fontWeight: 'var(--mdc-filled-button-label-text-weight)',
          cursor: 'pointer',
          transition: 'box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          userSelect: 'none',
          minWidth: '64px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 36
        },
        states: {
          hover: {
            fill: 'var(--mdc-filled-button-container-color)',
            style: {
              color: 'var(--mdc-filled-button-label-text-color)'
            }
          },
          select: {
            fill: 'var(--mdc-filled-button-container-color)',
          }
        },
        paddingLeft: 24,
        paddingRight: 24,
        height: 24,
        r: 24
      },
      position: {
        align: 'right',
        verticalAlign: 'top',
        x: -10,
        y: 10
      }
    },
    width: null, // Let chart size flexibly
    height: null
  },
  drilldown: {
    breadcrumbs: {
      position: {
        align: 'right'
      },
      buttonTheme: {
        // fill: 'var(--mat-sys-surface-container)',
        style: {
          color: 'var(--mat-sys-primary)',
          fontFamily: 'var(--mat-sys-body-large-font)',
          fontWeight: 'var(--mat-sys-body-large-weight)'
        },
        // stroke: 'var(--mat-sys-outline)',
        // 'stroke-width': 1,
        states: {
          hover: {
            fill: 'var(--mat-sys-surface-container)',
            style: {
              color: 'var(--mat-sys-on-surface)'
            }
          },
          select: {
            // fill: 'var(--mat-sys-surface-container-highest)',
            style: {
              color: 'var(--mat-sys-on-surface)'
            }
          }
        }
      },
      separator: {
        style: {
          color: 'var(--mat-sys-on-surface-variant)',
        }
      }
    },
    activeAxisLabelStyle: {
      color: 'var(--mat-sys-primary)',
      textDecoration: 'none',
      fontWeight: 'var(--mat-sys-title-medium-weight)',
      textOutline: 'none',
      cursor: 'pointer'
    },
    activeDataLabelStyle: {
      color: 'var(--mat-sys-primary)',
      textDecoration: 'none',
      fontWeight: 'var(--mat-sys-title-medium-weight)',
      textOutline: 'none',
      cursor: 'pointer'
    },
    // drillUpButton: {
    //   relativeTo: 'spacingBox',
    //   position: {
    //     y: 0,
    //     x: 0
    //   },
    //   theme: {
    //     fill: 'var(--mat-sys-surface-container)',
    //     'stroke-width': 1,
    //     stroke: 'var(--mat-sys-outline)',
    //     r: 4,
    //     states: {
    //       hover: {
    //         fill: 'var(--mat-sys-surface-container-high)'
    //       }
    //     }
    //   }
    // }
  },
  lang: {
    thousandsSep: ',',
  },
  title: {
    text: undefined,
    align: 'left',
    style: {
      color: 'var(--mat-sys-on-surface)',
      font: 'var(--mat-sys-title-large)',
      padding: '0 0 0.6em 0',
    }
  },
  subtitle: {
    align: 'left',
    style: {
      color: 'var(--mat-sys-on-surface-variant)',
      font: 'var(--mat-sys-title-medium)',
    }
  },
  xAxis: xAxisConfig,
  yAxis: yAxisConfig,
  legend: {
    align: 'left',
    verticalAlign: 'top',
    itemStyle: {
      color: 'var(--mat-sys-on-surface)',
      font: 'var(--mat-sys-body-large)'
    },
    itemHoverStyle: {
      color: 'var(--mat-sys-primary)'
    },
    backgroundColor: 'var(--mat-sys-surface-container)'
  },
  tooltip: {
    backgroundColor: 'var(--mat-sys-surface-container)',
    borderColor: 'var(--mat-sys-outline)',
    borderRadius: 4,
    padding: 12,
    shadow: {
      color: 'var(--mat-sys-shadow)',
      offsetX: 2,
      offsetY: 2,
      opacity: 0.2
    },
    style: {
      color: 'var(--mat-sys-on-surface)',
      font: 'var(--mat-sys-body-medium)',
      fontSize: '14px'
    },
    useHTML: true,
    headerFormat: tooltipHeaderFormat,
    pointFormat: tooltipPointFormat,
    footerFormat: tooltipFooterFormat
  },
  plotOptions: {
    column: {
      borderRadius: 4,
      borderWidth: 0
    },
    pie: {
      borderWidth: 0,
      borderRadius: 4,
      dataLabels: {
        style: {
          font: 'var(--mat-sys-label-large)',
          color: 'var(--mat-sys-on-surface)',
          fontSize: '14px',
          opacity: 0.87,
          fontWeight: 'var(--mat-sys-label-large-weight)',
          textOutline: 'none',
        },
        distance: 20,
        connectorWidth: 1,
        connectorColor: 'var(--mat-sys-outline-variant)'
      }
    }
  },
  accessibility: {
    announceNewData: {
      enabled: true
    },
    description: 'Chart showing data visualization'
  },
  navigation: {
    buttonOptions: {
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
  credits: {
    enabled: false
  },
  exporting: {
    enabled: false,
    buttons: {
      contextButton: {
        symbol: 'menu',
        symbolStroke: 'var(--mat-sys-on-surface)',
        symbolStrokeWidth: 2,
        theme: {
          fill: 'var(--mat-sys-surface-container)',
          stroke: '0px var(--mat-sys-outline)'
        },
      }
    },
    chartOptions: {
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            style: {
              fontSize: '14px',
              fontWeight: 'normal',
              textOutline: 'none'
            }
          }
        }
      }
    }
  }
};
Highcharts.setOptions(theme);
