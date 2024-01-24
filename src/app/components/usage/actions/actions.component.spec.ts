import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionsUsageComponent } from './actions.component';

describe('ActionsUsageComponent', () => {
  let component: ActionsUsageComponent;
  let fixture: ComponentFixture<ActionsUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionsUsageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActionsUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
