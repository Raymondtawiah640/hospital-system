import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentHistory } from './appointment-history';

describe('AppointmentHistory', () => {
  let component: AppointmentHistory;
  let fixture: ComponentFixture<AppointmentHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
