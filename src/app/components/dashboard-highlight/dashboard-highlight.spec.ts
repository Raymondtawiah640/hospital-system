import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardHighlight } from './dashboard-highlight';

describe('DashboardHighlight', () => {
  let component: DashboardHighlight;
  let fixture: ComponentFixture<DashboardHighlight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHighlight]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardHighlight);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
