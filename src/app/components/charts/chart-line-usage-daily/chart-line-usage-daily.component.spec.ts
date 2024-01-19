import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartLineUsageHourlyComponent } from './chart-line-usage-hourly.component';

describe('ChartLineUsageHourlyComponent', () => {
  let component: ChartLineUsageHourlyComponent;
  let fixture: ComponentFixture<ChartLineUsageHourlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartLineUsageHourlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartLineUsageHourlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
