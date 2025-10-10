import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDoctor } from './add-doctor';

describe('AddDoctor', () => {
  let component: AddDoctor;
  let fixture: ComponentFixture<AddDoctor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDoctor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddDoctor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
