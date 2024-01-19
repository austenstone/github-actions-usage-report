import { ChangeDetectorRef, Component } from '@angular/core';
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
    private usageReportService: UsageReportService
  ) { }

  ngOnInit() {
  }

  async onFileText(fileText: string) {
    this.usage = await this.usageReportService.setUsageReportData(fileText);
    this.cdr.detectChanges();
  }
}
