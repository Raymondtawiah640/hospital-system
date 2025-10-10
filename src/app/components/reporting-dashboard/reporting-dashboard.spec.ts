import { TestBed } from '@angular/core/testing';
import { ReportingDashboard } from './reporting-dashboard';

describe('ReportingDashboard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportingDashboard],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(ReportingDashboard);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});