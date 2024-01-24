import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedStorageComponent } from './shared-storage.component';

describe('SharedStorageComponent', () => {
  let component: SharedStorageComponent;
  let fixture: ComponentFixture<SharedStorageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedStorageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharedStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
