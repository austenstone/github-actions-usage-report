import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartPieSkuComponent } from './chart-pie-sku.component';

describe('ChartPieSkuComponent', () => {
  let component: ChartPieSkuComponent;
  let fixture: ComponentFixture<ChartPieSkuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartPieSkuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChartPieSkuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
