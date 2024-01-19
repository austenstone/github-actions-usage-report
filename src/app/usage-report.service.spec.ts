import { TestBed } from '@angular/core/testing';

import { UsageReportService } from './usage-report.service';

describe('UsageReportService', () => {
  let service: UsageReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsageReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
