import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPatients } from './all-patients';

describe('AllPatients', () => {
  let component: AllPatients;
  let fixture: ComponentFixture<AllPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPatients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPatients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
