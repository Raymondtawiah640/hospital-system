import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAppointments } from './all-appointments';

describe('AllAppointments', () => {
  let component: AllAppointments;
  let fixture: ComponentFixture<AllAppointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAppointments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllAppointments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
