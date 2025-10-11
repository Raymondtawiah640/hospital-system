import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDepartmentResult } from './general-department-result';

describe('GeneralDepartmentResult', () => {
  let component: GeneralDepartmentResult;
  let fixture: ComponentFixture<GeneralDepartmentResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDepartmentResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralDepartmentResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
