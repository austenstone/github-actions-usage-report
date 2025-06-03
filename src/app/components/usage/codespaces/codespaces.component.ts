import { Component, Input } from '@angular/core';
import { UsageReportItem } from 'src/app/usage-report.service';

@Component({
    selector: 'app-codespaces',
    templateUrl: './codespaces.component.html',
    styleUrl: './codespaces.component.scss',
    standalone: false
})
export class CodespacesComponent {
  @Input() data!: UsageReportItem[];
  @Input() currency!: string;
}
