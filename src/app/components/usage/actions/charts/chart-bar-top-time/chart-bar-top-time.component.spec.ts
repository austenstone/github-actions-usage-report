import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartBarTopTimeComponent } from './chart-bar-top-time.component';

describe('ChartBarTopTimeComponent', () => {
  let component: ChartBarTopTimeComponent;
  let fixture: ComponentFixture<ChartBarTopTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartBarTopTimeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartBarTopTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
