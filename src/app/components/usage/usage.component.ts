import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone, ViewChild, isDevMode } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { UsageReport, UsageReportCallback, UsageReportLine } from 'github-usage-report/types';
import { readGithubUsageReport } from 'github-usage-report/usage-report';
import { BehaviorSubject, Observable, debounceTime, map, merge, startWith } from 'rxjs';
import { UsageReportService } from 'src/app/usage-report.service';

const GITHUB_ICON = `<svg width="24px" height="24px" viewBox="1 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#fff"/>
</svg>`;

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent {
  usage: UsageReport | null = null;
  usageLines: UsageReportLine[] = [];
  usageLinesSharedStorage: UsageReportLine[] = [];
  status: string = 'Choose File';
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  minDate!: Date;
  maxDate!: Date;
  workflows: string[] = [];
  workflow!: string;
  filteredWorkflows!: Observable<string[]>;
  workflowControl = new FormControl('');
  progress: number | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private usageReportService: UsageReportService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    iconRegistry.addSvgIconLiteral('github', sanitizer.bypassSecurityTrustHtml(GITHUB_ICON));
  }

  ngOnInit() {
    this.range.valueChanges.pipe(debounceTime(500)).subscribe(value => {
      if (value.start && value.start instanceof Date && !isNaN(value.start.getTime()) &&
        value.end && value.end instanceof Date && !isNaN(value.end.getTime())) {
        this.usageReportService.applyDateFilter(value.start, value.end);
        const usage = this.usageReportService.getUsageReport;
        this.loadUsageReport(usage);
        // this.cdr.detectChanges();
      }
    });

    this.workflowControl.valueChanges.subscribe(value => {
      this.usageReportService.applyWorkflowFilter(value || '');
      const usage = this.usageReportService.getUsageReport;
      this.loadUsageReport(usage);
      // this.cdr.detectChanges();
    });

    this.filteredWorkflows = this.workflowControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    this.usageReportService.getUsageReportFiltered().subscribe((usage) => {
      this.usageLines = usage;
      this.usageLinesSharedStorage = usage.filter(line => line.sku === 'Shared Storage');
      // this.cdr.detectChanges();
    });
  }

  loadUsageReport(usage: UsageReport) {
    this.usage = usage;
    this.usageLinesSharedStorage = this.usage.lines.filter(line => line.sku === 'Shared Storage');
    if (usage.lines.length > 0) {
      this.workflows = this.usageReportService.getWorkflows();
    }
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
    })
      .then(async (usage) => {
        this.status = 'Loading... Be patient, this may take a while.';
        return new Promise<UsageReport>(resolve => setTimeout(() => resolve(usage), 100));
      });
    this.minDate = new Date(usage.lines[0]?.date);
    this.maxDate = new Date(usage.lines[usage.lines.length - 1]?.date);
    this.range.controls.start.setValue(usage.lines[0]?.date, { emitEvent: false });
    this.range.controls.end.setValue(usage.lines[usage.lines.length - 1]?.date, { emitEvent: false });
    this.loadUsageReport(usage);
    this.status = 'Choose File';
    this.progress = null;
    // this.cdr.detectChanges();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.workflows.filter(option => option.toLowerCase().includes(filterValue));
  }

  navigateToBilling() {
    const orgName = prompt('Organization Name');
    if (orgName && orgName !== '') {
      window.open(`https://github.com/organizations/${orgName}/settings/billing/summary`);
    }
  }
}
