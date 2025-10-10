import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientRecords } from './patient-records';

describe('PatientRecords', () => {
  let component: PatientRecords;
  let fixture: ComponentFixture<PatientRecords>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientRecords]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientRecords);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
