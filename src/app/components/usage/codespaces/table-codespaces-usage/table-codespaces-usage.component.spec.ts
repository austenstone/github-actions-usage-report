import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCodespacesUsageComponent } from './table-codespaces-usage.component';

describe('TableCodespacesUsageComponent', () => {
  let component: TableCodespacesUsageComponent;
  let fixture: ComponentFixture<TableCodespacesUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCodespacesUsageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableCodespacesUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
