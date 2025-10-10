import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyReports } from './monthly-reports';

describe('MonthlyReports', () => {
  let component: MonthlyReports;
  let fixture: ComponentFixture<MonthlyReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
