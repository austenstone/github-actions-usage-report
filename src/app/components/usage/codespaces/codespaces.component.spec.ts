import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodespacesComponent } from './codespaces.component';

describe('CodespacesComponent', () => {
  let component: CodespacesComponent;
  let fixture: ComponentFixture<CodespacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodespacesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CodespacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
