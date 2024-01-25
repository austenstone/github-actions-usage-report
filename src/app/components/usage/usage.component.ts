import { OnInit, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { UsageReport, UsageReportLine } from 'github-usage-report/types';
import { Observable, debounceTime, map, startWith } from 'rxjs';
import { UsageReportService } from 'src/app/usage-report.service';

const GITHUB_ICON = `<svg width="24px" height="24px" viewBox="1 0 100 100" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"/>
</svg>`;
const COPILOT_ICON = `<svg width="256px" height="208px" viewBox="0 0 256 208" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid">
<path d="M205.28,31.36 C219.376,46.24 225.296,66.56 227.792,95.04 C234.417867,95.04 240.5968,96.5093333 244.768,102.192 L252.56,112.752 C254.8,115.792 256,119.424 256,123.2 L256,151.888 C255.992,155.592267 254.1568,159.203467 251.168,161.392 C215.885333,187.222133 172.3496,208 128,208 C78.9344,208 29.8098667,179.726667 4.832,161.392 C1.84330667,159.203467 0.00722666667,155.592267 0,151.888 L0,123.2 C0,119.424 1.2,115.776 3.424,112.736 L11.216,102.192 C15.3891733,96.5349333 21.5953067,95.04 28.208,95.04 C30.704,66.56 36.608,46.24 50.72,31.36 C77.3312,3.1648 112.56728,0.06016 127.552142,0.00088672 L128,0 C142.72,0 178.4,2.88 205.28,31.36 Z M128.016,78.736 C124.976,78.736 121.472,78.912 117.744,79.28 C116.432,84.176 114.496,88.592 111.664,91.408 C100.464,102.608 86.96,104.336 79.728,104.336 C72.9258667,104.336 65.8005333,102.915733 59.984,99.248 C54.4816,101.056 49.1978667,103.6632 48.848,110.16 C48.2621333,122.440533 48.2112,134.709333 48.1602667,146.984 C48.1336,153.144533 48.1093333,159.3064 48.016,165.472 C48.04,169.050667 50.1978667,172.3752 53.456,173.856 C79.936,185.92 104.976,192 128.016,192 C151.024,192 176.064,185.92 202.528,173.856 C205.786133,172.3752 207.9432,169.050667 207.968,165.472 C208.285333,147.0536 208.029867,128.560267 207.152,110.16 L207.168,110.16 C206.826133,103.625867 201.520267,101.061867 196,99.248 C190.179467,102.899733 183.072533,104.336 176.272,104.336 C169.04,104.336 155.552,102.608 144.336,91.408 C141.504,88.592 139.568,84.176 138.256,79.28 C134.853333,78.9338667 131.436,78.7525333 128.016,78.736 Z M101.074933,122.666667 C106.8232,122.666667 111.4832,127.326667 111.4832,133.074933 L111.4832,152.2584 C111.4832,158.006667 106.8232,162.666667 101.074933,162.666667 C95.3266667,162.666667 90.6666667,158.006667 90.6666667,152.2584 L90.6666667,133.074933 C90.6666667,127.326667 95.3266667,122.666667 101.074933,122.666667 Z M154.408267,122.666667 C160.156533,122.666667 164.816533,127.326667 164.816533,133.074933 L164.816533,133.074933 L164.816533,152.2584 C164.816533,158.006667 160.156533,162.666667 154.408267,162.666667 C148.66,162.666667 144,158.006667 144,152.2584 L144,152.2584 L144,133.074933 C144,127.326667 148.66,122.666667 154.408267,122.666667 Z M81.44,28.32 C70.24,29.44 60.8,33.12 56,38.24 C45.6,49.6 47.84,78.4 53.76,84.48 C58.08,88.8 66.24,91.68 75.04,91.68 C81.76,91.68 94.56,90.24 105.12,79.52 C109.76,75.04 112.64,63.84 112.32,52.48 C112,43.36 109.44,35.84 105.6,32.64 C101.44,28.96 92,27.36 81.44,28.32 Z M150.4,32.64 C146.56,35.84 144,43.36 143.68,52.48 C143.36,63.84 146.24,75.04 150.88,79.52 C161.44,90.24 174.24,91.68 180.96,91.68 C189.76,91.68 197.92,88.8 202.24,84.48 C208.16,78.4 210.4,49.6 200,38.24 C195.2,33.12 185.76,29.44 174.56,28.32 C164,27.36 154.56,28.96 150.4,32.64 Z M128,56 C125.44,56 122.4,56.16 119.04,56.48 C119.36,58.24 119.52,60.16 119.68,62.24 C119.68,63.68 119.68,65.12 119.52,66.72 C122.72,66.4 125.44,66.4 128,66.4 C130.559733,66.4 133.28,66.4 136.48,66.72 C136.32,65.12 136.32,63.6802667 136.32,62.2402667 C136.48,60.1602667 136.64,58.24 136.96,56.48 C133.6,56.16 130.56,56 128,56 Z"></path>
</svg>
`;

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent implements OnInit {
  usage: UsageReport | null = null;
  usageSkus: string[] = [];
  usageLines: UsageReportLine[] = [];
  usageLinesSharedStorage: UsageReportLine[] = [];
  usageLinesSharedCopilot: UsageReportLine[] = [];
  status: string = 'Choose File';
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl()
  });
  minDate!: Date;
  maxDate!: Date;
  days: number = 0;
  workflows: string[] = [];
  workflow!: string;
  filteredWorkflows!: Observable<string[]>;
  workflowControl = new FormControl('');
  skuControl = new FormControl('');
  progress: number | null = null;

  constructor(
    private usageReportService: UsageReportService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer,
    public dialog: MatDialog
  ) {
    iconRegistry.addSvgIconLiteral('github', sanitizer.bypassSecurityTrustHtml(GITHUB_ICON));
    iconRegistry.addSvgIconLiteral('copilot', sanitizer.bypassSecurityTrustHtml(COPILOT_ICON));
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
      usage.forEach(line => {
        if (line.sku === 'Shared Storage') {
          this.usageLinesSharedStorage.push(line);
        } else if (line.sku === 'Shared Copilot') {
          this.usageLinesSharedCopilot.push(line);
        }
      });
      // this.cdr.detectChanges();
    });
  }

  loadUsageReport(usage: UsageReport) {
    this.usage = usage;
    let diffInTime = this.usage.endDate.getTime() - this.usage.startDate.getTime();
    this.days = diffInTime / (1000 * 3600 * 24);
    this.usageLinesSharedStorage = this.usage.lines.filter(line => line.sku === 'Shared Storage');
    this.usageSkus = this.usage.lines.map(line => line.sku).filter((value, index, self) => self.indexOf(value) === index);
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
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.isEnterprise) {
          window.open(`https://github.com/enterprises/${result.name}/settings/billing`);
        } else {
          window.open(`https://github.com/organizations/${result.name}/settings/billing/summary`);
        }
      }
    });
  }
}


import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

interface DialogData {
  name: string;
  isEnterprise: boolean;
}

@Component({
  selector: 'app-dialog-billing-navigate',
  templateUrl: 'dialog-billing-navigate.html',
})
export class DialogOverviewExampleDialog {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.data = {
      name: '',
      isEnterprise: true
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onToggleEnterprise() {
    this.data.isEnterprise = !this.data.isEnterprise;
  }
}