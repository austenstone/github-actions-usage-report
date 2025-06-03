import { OnInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UsageReport } from 'github-usage-report/src/types';
import { Observable, Subscription, debounceTime, map, startWith } from 'rxjs';
import { CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';
import { DialogBillingNavigateComponent } from './dialog-billing-navigate';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-usage',
    templateUrl: './usage.component.html',
    styleUrls: ['./usage.component.scss'],
    standalone: false
})
export class UsageComponent implements OnInit, OnDestroy {
  usage!: UsageReport;
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

  constructor(
    private usageReportService: UsageReportService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    this.subscriptions.push(
      this.range.valueChanges.pipe(debounceTime(500)).subscribe(value => {
        if (value.start && value.start instanceof Date && !isNaN(value.start.getTime()) &&
          value.end && value.end instanceof Date && !isNaN(value.end.getTime())) {
          this.usageReportService.applyFilter({
            startDate: value.start,
            endDate: value.end,
          });
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
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  async onFileText(fileText: string) {
    this.status = 'Parsing File...';
    const usage = await this.usageReportService.setUsageReportData(fileText, async (_: any, progress: any): Promise<any> => {
      return await new Promise((resolve) => {
        if (progress === this.progress) return resolve('');
        setTimeout(() => {
          this.progress = progress;
          this.status = `Parsing File... ${progress}%`
          resolve('');
        }, 0)
      });
    }).then(async (usage) => {
      this.status = 'Loading... Be patient, this may take a while.';
      return new Promise<UsageReport>(resolve => setTimeout(() => resolve(usage), 100));
    });
    this.minDate = new Date(usage.lines[0]?.date);
    this.maxDate = new Date(usage.lines[usage.lines.length - 1]?.date);
    // make the date 00:00:00
    this.minDate.setHours(0, 0, 0, 0);
    this.maxDate.setHours(0, 0, 0, 0);
    this.range.controls.start.setValue(this.minDate, { emitEvent: false });
    this.range.controls.end.setValue(this.maxDate, { emitEvent: false });
    this.status = 'Usage Report';
    this.progress = null;
    this.usage = usage;
    this.cdr.detectChanges();
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
}
