import { OnInit, ChangeDetectorRef, Component, OnDestroy, inject, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UsageReport } from 'github-usage-report/src/types';
import { Observable, Subscription, debounceTime, map, startWith } from 'rxjs';
import { AggregationType, CustomUsageReportLine, UsageReportService } from 'src/app/usage-report.service';
import { DialogBillingNavigateComponent } from './dialog-billing-navigate';
import { MatDialog } from '@angular/material/dialog';
import { ModelUsageReport } from 'github-usage-report';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  standalone: false
})
export class UsageComponent implements OnInit, OnDestroy {
  @Input() theme!: 'light-theme' | 'dark-theme';
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
  workflow!: string;
  status: string = 'Usage Report';
  progress: number | null = null;
  subscriptions: Subscription[] = [];
  filter: string = '';
  currency: 'minutes' | 'cost' = 'cost';
  tabSelected: 'shared-storage' | 'copilot' | 'actions' = 'actions';
  groupingControl = new FormControl<AggregationType>('sku' as AggregationType);
  private _bottomSheet = inject(MatBottomSheet);

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
      })
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
    const usage = await (type === 'metered' ? this.usageReportService.setUsageReportData(fileText, progressFunction) : type === 'copilot_premium_requests' ? this.usageReportService.setUsageReportCopilotPremiumRequests(fileText, progressFunction) : null);
    if (!usage) {
      this.status = 'Error parsing file. Please check the file format.';
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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filter = filterValue.trim().toLowerCase();
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
  
  openBottomSheet(): void {
    this._bottomSheet.open(BottomSheetOverviewExampleSheetComponent, {
      autoFocus: false
    });
  }

  reloadPage() {
    window.location.reload();
  }
}

@Component({
  selector: 'app-bottom-sheet-overview-example-sheet',
  standalone: false,
  // templateUrl: 'bottom-sheet-overview-example-sheet.html',
  template: `
    <mat-form-field style="flex: 1; max-width: 500px;" *ngIf="tabSelected === 'actions'">
      <mat-label>Workflow</mat-label>
      <input type="text" placeholder="build.yml" aria-label="Number" matInput [formControl]="workflowControl"
        [matAutocomplete]="auto" name="workflow">
      <mat-autocomplete #auto="matAutocomplete">
        @for (option of _filteredWorkflows | async; track option) {
        <mat-option [value]="option">{{option}}</mat-option>
        }
      </mat-autocomplete>
      @if (workflowControl.value) {
      <button matSuffix mat-icon-button aria-label="Clear" (click)="workflowControl.setValue('')">
        <mat-icon>close</mat-icon>
      </button>
      }
    </mat-form-field>
  `
})
export class BottomSheetOverviewExampleSheetComponent {
  @Input() tabSelected: 'shared-storage' | 'copilot' | 'actions' = 'actions';
  private _bottomSheetRef =
    inject<MatBottomSheetRef<BottomSheetOverviewExampleSheetComponent>>(MatBottomSheetRef);

  workflowControl = new FormControl('');
  _filteredWorkflows!: Observable<string[]>;
  workflows: string[] = [];

  constructor (
    private usageReportService: UsageReportService,
  ) {}

  ngOnInit() {
    this.usageReportService.getWorkflowsFiltered().subscribe((workflows) => {
        this.workflows = workflows;
    });
    this.workflowControl.valueChanges.subscribe(value => {
      if (!value || value === '') value = '';
      this.usageReportService.applyFilter({
        workflow: value,
      });
    })
    this._filteredWorkflows = this.workflowControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterWorkflows(value || '')),
    );
  }

  private _filterWorkflows(workflow: string): string[] {
    const filterValue = workflow.toLowerCase();
    return this.workflows.filter(option => option.toLowerCase().includes(filterValue));
  }

  openLink(event: MouseEvent): void {
    this._bottomSheetRef.dismiss();
    event.preventDefault();
  }
}