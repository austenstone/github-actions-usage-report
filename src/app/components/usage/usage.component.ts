import { OnInit, ChangeDetectorRef, Component, OnDestroy, isDevMode } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription, debounceTime, map, startWith } from 'rxjs';
import { CustomUsageReportLine, UsageReport, UsageReportService } from 'src/app/usage-report.service';
import { DialogBillingNavigateComponent } from './dialog-billing-navigate';
import { MatDialog } from '@angular/material/dialog';
import { ModelUsageReport } from 'github-usage-report';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  standalone: false
})
export class UsageComponent implements OnInit, OnDestroy {
  usage!: UsageReport;
  usageCopilotPremiumRequests!: ModelUsageReport;
  usageLines = {} as {
    sharedStorage: CustomUsageReportLine[],
    codespaces: CustomUsageReportLine[],
    copilot: CustomUsageReportLine[],
    actions: CustomUsageReportLine[],
  };
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  minDate!: Date;
  maxDate!: Date;
  workflows: string[] = [];
  workflow!: string;
  _filteredWorkflows!: Observable<string[]>;
  workflowControl = new FormControl('');
  status: string = 'Usage Report';
  progress: number | null = null;
  subscriptions: Subscription[] = [];
  currency: 'minutes' | 'cost' = 'cost';
  tabSelected: 'shared-storage' | 'copilot' | 'actions' = 'actions';
  hasWorkflowData: boolean = false;
  formatType: 'legacy' | 'summarized' | null = null;

  constructor(
    private usageReportService: UsageReportService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    // Auto-load test data in development mode
    if (isDevMode()) {
      this.loadTestData();
    }

    this.subscriptions.push(
      this.range.valueChanges.pipe(debounceTime(500)).subscribe(value => {
        if (value.start && value.start instanceof Date && !isNaN(value.start.getTime()) &&
          value.end && value.end instanceof Date && !isNaN(value.end.getTime())) {
          // Validate date range: if end is before start, swap them
          if (value.end < value.start) {
            const temp = value.start;
            this.range.controls.start.setValue(value.end, { emitEvent: false });
            this.range.controls.end.setValue(temp, { emitEvent: false });
            // Update the filter with swapped values
            this.usageReportService.applyFilter({
              startDate: value.end,
              endDate: temp,
            });
          } else {
            this.usageReportService.applyFilter({
              startDate: value.start,
              endDate: value.end,
            });
          }
        }
      })
    );

    this.subscriptions.push(
      this.workflowControl.valueChanges.subscribe(value => {
        if (!value || value === '') value = '';
        this.usageReportService.applyFilter({
          workflow: value,
        });
      })
    );
    this._filteredWorkflows = this.workflowControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      map(value => this._filterWorkflows(value || '')),
    );

    this.subscriptions.push(
      this.usageReportService.getUsageFilteredByProduct('actions').subscribe((usageLines) => {
        this.usageLines.actions = usageLines;
      }),
      this.usageReportService.getUsageFilteredByProduct('git_lfs').subscribe((usageLines) => {
        this.usageLines.sharedStorage = usageLines;
      }),
      this.usageReportService.getUsageFilteredByProduct('copilot').subscribe((usageLines) => {
        this.usageLines.copilot = usageLines;
      }),
      this.usageReportService.getUsageFilteredByProduct('codespaces').subscribe((usageLines) => {
        this.usageLines.codespaces = usageLines;
      }),
      this.usageReportService.getWorkflowsFiltered().subscribe((workflows) => {
        this.workflows = workflows;
      }),
      this.usageReportService.formatType.subscribe((formatType) => {
        this.formatType = formatType;
        this.hasWorkflowData = this.usageReportService.hasWorkflowData;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  async onFileText(fileText: string, type: 'metered' | 'copilot_premium_requests') {
    this.status = 'Parsing File...';

    const progressFunction = async (_: any, progress: any): Promise<any> => {
        return await new Promise((resolve) => {
          if (progress === this.progress) return resolve('');
            this.progress = progress;
            this.status = `Parsing File... ${progress}%`
            resolve(''); 
        });
      };
    try {
      const usage = await (type === 'metered' ? this.usageReportService.setUsageReportData(fileText, progressFunction) : type === 'copilot_premium_requests' ? this.usageReportService.setUsageReportCopilotPremiumRequests(fileText, progressFunction) : null);
      if (!usage) {
        this.status = 'Error: Unable to parse file. Please ensure it\'s a valid GitHub usage report CSV.';
        this.progress = null;
        return;
      }
      if (!usage.lines || usage.lines.length === 0) {
        this.status = 'Error: The file contains no usage data. Please check the file format.';
        this.progress = null;
        return;
      }
      const firstLine = usage.lines[0];
      const lastLine = usage.lines[usage.lines.length - 1];
      this.minDate = new Date(firstLine && 'date' in firstLine ? firstLine.date : new Date());
      this.maxDate = new Date(lastLine && 'date' in lastLine ? lastLine.date : new Date());
      // make the date 00:00:00
      this.minDate.setHours(0, 0, 0, 0);
      this.maxDate.setHours(0, 0, 0, 0);
      this.range.controls.start.setValue(this.minDate, { emitEvent: false });
      this.range.controls.end.setValue(this.maxDate, { emitEvent: false });
      if (type === 'copilot_premium_requests') {
        this.usageCopilotPremiumRequests = usage as ModelUsageReport;
      } else {
        this.usage = usage as UsageReport;
      }
      this.status = 'Usage Report';
      this.progress = null;
      this.cdr.detectChanges();
    } catch (error: any) {
      this.status = `Error parsing file: ${error.message || 'Invalid format or corrupted data'}. Please ensure you\'re uploading a valid GitHub usage report CSV.`;
      this.progress = null;
      console.error('Parse error:', error);
    }
  }

  private _filterWorkflows(workflow: string): string[] {
    const filterValue = workflow.toLowerCase();
    return this.workflows.filter(option => option.toLowerCase().includes(filterValue));
  }

  navigateToBilling() {
    const dialogRef = this.dialog.open(DialogBillingNavigateComponent);

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        if (result.isEnterprise) {
          window.open(`https://github.com/enterprises/${result.name}/settings/billing`);
        } else {
          window.open(`https://github.com/organizations/${result.name}/settings/billing/summary`);
        }
      }
    });
  }

  changeCurrency(currency: string) {
    this.currency = currency as 'minutes' | 'cost';
    this.usageReportService.setValueType(this.currency);
  }

  tabChanged(event: any) {
    if (event.index === 0) {
      this.tabSelected = 'actions';
    } else if (event.index === 1) {
      this.tabSelected = 'shared-storage';
    } else if (event.index === 2) {
      this.tabSelected = 'copilot';
    }
  }

  exportHtml() {
    function getStyles(doc: any) {
      var styles = '';
      for (var i = 0; i < doc.styleSheets.length; i++) {
        try {
          var rules = doc.styleSheets[i].cssRules;
          for (var j = 0; j < rules.length; j++) {
            styles += rules[j].cssText + '\n';
          }
        } catch (e) {
          console.warn('Unable to access CSS rules:', e);
        }
      }
      return styles;
    }

    const a = document.createElement('a');
    a.download = `usage-report-${this.tabSelected}-${new Date().toISOString()}.html`;

    const clone = document.documentElement.cloneNode(true);
    const style = document.createElement('style');
    style.innerHTML = getStyles(document);
    (clone as any).querySelector('head').appendChild(style);

    const bb = new Blob([(clone as any).outerHTML], { type: 'text/html' });
    a.href = window.URL.createObjectURL(bb);
    document.body.appendChild(a);
    a.click();
    (a as any).parentNode.removeChild(a);
  }

  private async loadTestData() {
    try {
      const response = await this.http.get('assets/github-usage-report.csv', { responseType: 'text' }).toPromise();
      if (response) {
        console.log('Auto-loading test data in development mode...');
        await this.onFileText(response, 'metered');
      }
    } catch (error) {
      console.warn('Could not auto-load test data:', error);
    }
  }
}
