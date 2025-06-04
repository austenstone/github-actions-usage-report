import { Component, Input } from '@angular/core';
import { CustomUsageReportLine } from 'src/app/usage-report.service';

@Component({
    selector: 'app-codespaces',
    templateUrl: './codespaces.component.html',
    styleUrl: './codespaces.component.scss',
    standalone: false
})
export class CodespacesComponent {
  @Input() data!: CustomUsageReportLine[];
  @Input() currency!: 'minutes' | 'cost';
}
