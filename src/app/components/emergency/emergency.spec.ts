import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Emergency } from './emergency';

describe('Emergency', () => {
  let component: Emergency;
  let fixture: ComponentFixture<Emergency>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Emergency]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Emergency);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
