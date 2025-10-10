import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pediatrics } from './pediatrics';

describe('Pediatrics', () => {
  let component: Pediatrics;
  let fixture: ComponentFixture<Pediatrics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pediatrics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pediatrics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
