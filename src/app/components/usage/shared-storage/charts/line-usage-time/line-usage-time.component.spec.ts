import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineUsageTimeComponent } from './line-usage-time.component';

describe('LineUsageTimeComponent', () => {
  let component: LineUsageTimeComponent;
  let fixture: ComponentFixture<LineUsageTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineUsageTimeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LineUsageTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
