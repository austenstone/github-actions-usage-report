import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartLineUsageTimeComponent } from './chart-line-usage-time.component';

describe('ChartLineUsageTimeComponent', () => {
  let component: ChartLineUsageTimeComponent;
  let fixture: ComponentFixture<ChartLineUsageTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartLineUsageTimeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartLineUsageTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
