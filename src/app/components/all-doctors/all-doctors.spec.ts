import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDoctors } from './all-doctors';

describe('AllDoctors', () => {
  let component: AllDoctors;
  let fixture: ComponentFixture<AllDoctors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDoctors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllDoctors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
