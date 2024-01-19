import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartPieOwnerComponent } from './chart-pie-owner.component';

describe('ChartPieOwnerComponent', () => {
  let component: ChartPieOwnerComponent;
  let fixture: ComponentFixture<ChartPieOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartPieOwnerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartPieOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
