import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopilotComponent } from './copilot.component';

describe('CopilotComponent', () => {
  let component: CopilotComponent;
  let fixture: ComponentFixture<CopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopilotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
