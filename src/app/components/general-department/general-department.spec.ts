import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDepartment } from './general-department';

describe('GeneralDepartment', () => {
  let component: GeneralDepartment;
  let fixture: ComponentFixture<GeneralDepartment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDepartment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralDepartment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
