import { ChangeDetectorRef, Component } from '@angular/core';
import { UsageReport } from 'github-usage-report/types';
import { readGithubUsageReport } from 'github-usage-report/usage-report';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss']
})
export class UsageComponent {
  usage: UsageReport | null = null;

  constructor(private cdr: ChangeDetectorRef) { } // inject ChangeDetectorRef

  ngOnInit() {
    const oldUsage = localStorage.getItem('usage');
    this.usage = oldUsage ? JSON.parse(oldUsage) : null;
  }

  async onFileText(fileText: string) {
    const usage = await readGithubUsageReport(fileText);
    this.usage = usage;
    this.cdr.detectChanges(); // manually trigger change detection
  }
}
