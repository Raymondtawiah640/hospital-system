import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyReports } from './daily-reports';

describe('DailyReports', () => {
  let component: DailyReports;
  let fixture: ComponentFixture<DailyReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
