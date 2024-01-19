import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartPieUserComponent } from './chart-pie-user.component';

describe('ChartPieOwnerComponent', () => {
  let component: ChartPieUserComponent;
  let fixture: ComponentFixture<ChartPieUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartPieUserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartPieUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
