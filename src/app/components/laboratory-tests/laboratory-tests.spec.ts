import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LaboratoryTests } from './laboratory-tests';

describe('LaboratoryTests', () => {
  let component: LaboratoryTests;
  let fixture: ComponentFixture<LaboratoryTests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LaboratoryTests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LaboratoryTests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
