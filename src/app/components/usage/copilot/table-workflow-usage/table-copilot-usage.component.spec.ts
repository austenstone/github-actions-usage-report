import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCopilotUsageComponent } from './table-copilot-usage.component';

describe('TableWorkflowUsageComponent', () => {
  let component: TableCopilotUsageComponent;
  let fixture: ComponentFixture<TableCopilotUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCopilotUsageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableCopilotUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
