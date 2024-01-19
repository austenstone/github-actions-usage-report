import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableWorkflowUsageComponent } from './table-workflow-usage.component';

describe('TableWorkflowUsageComponent', () => {
  let component: TableWorkflowUsageComponent;
  let fixture: ComponentFixture<TableWorkflowUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableWorkflowUsageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableWorkflowUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
