import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSharedStorageComponent } from './table-shared-storage.component';

describe('TableSharedStorageComponent', () => {
  let component: TableSharedStorageComponent;
  let fixture: ComponentFixture<TableSharedStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSharedStorageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TableSharedStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
