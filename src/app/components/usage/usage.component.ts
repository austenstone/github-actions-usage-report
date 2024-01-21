import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, isDevMode } from '@angular/core';
import { UsageReport } from 'github-usage-report/types';
import { readGithubUsageReport } from 'github-usage-report/usage-report';
import { UsageReportService } from 'src/app/usage-report.service';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent {
  usage: UsageReport | null = null;
  status: 'Choose File' | 'Parsing File...' = 'Choose File';

  constructor(
    private cdr: ChangeDetectorRef,
    private usageReportService: UsageReportService,
    private httpClient: HttpClient
  ) { }

  ngOnInit() {
    if (isDevMode()) {
      this.httpClient.get('assets/github-usage-report.csv', { responseType: 'text' }).subscribe((data) => {
        this.usageReportService.setUsageReportData(data).then((usage) => {
          this.usage = usage;
          this.cdr.detectChanges();
        });
      });
    }
  }

  async onFileText(fileText: string) {
    this.usage = await this.usageReportService.setUsageReportData(fileText);
    this.cdr.detectChanges();
  }
}
