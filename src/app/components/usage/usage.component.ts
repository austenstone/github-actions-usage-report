import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone, ViewChild, isDevMode } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { UsageReport, UsageReportCallback, UsageReportLine } from 'github-usage-report/types';
import { readGithubUsageReport } from 'github-usage-report/usage-report';
import { Observable, debounceTime, map, merge, startWith } from 'rxjs';
import { UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent {
  usage: UsageReport | null = null;
  usageLines: UsageReportLine[] = [];
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
    private usageReportService: UsageReportService
  ) { }

  ngOnInit() {
    this.range.valueChanges.pipe(debounceTime(500)).subscribe(value => {
      if (value.start && value.start instanceof Date && !isNaN(value.start.getTime()) &&
          value.end && value.end instanceof Date && !isNaN(value.end.getTime())) {
        this.usageReportService.applyDateFilter(value.start, value.end);
        const usage = this.usageReportService.getUsageReport;
        this.loadUsageReport(usage);
        this.cdr.detectChanges();
      }
    });

    this.workflowControl.valueChanges.subscribe(value => {
      console.log('workflowControl', value)
      this.usageReportService.applyWorkflowFilter(value || '');
      const usage = this.usageReportService.getUsageReport;
      this.loadUsageReport(usage);
      this.cdr.detectChanges();
    });

    this.filteredWorkflows = this.workflowControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    this.usageReportService.getUsageReportFiltered().subscribe((usage) => {
      this.usageLines = usage;
      this.cdr.detectChanges();
    });
  }

  loadUsageReport(usage: UsageReport) {
    this.usage = usage;
    console.warn('Usage report', usage)
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
    }).then(async (usage) => {
      this.status = 'Loading...';
      this.cdr.detectChanges();
      return new Promise<UsageReport>((resolve) => setTimeout(() => resolve(usage), 100));
    });
    this.minDate = new Date(usage.lines[0]?.date);
    this.maxDate = new Date(usage.lines[usage.lines.length - 1]?.date);
    this.range.controls.start.setValue(usage.lines[0]?.date);
    this.range.controls.end.setValue(usage.lines[usage.lines.length - 1]?.date);
    this.loadUsageReport(usage);
    this.status = 'Choose File';
    this.progress = null;
    this.cdr.detectChanges();
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
