import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PharmacyStock } from './pharmacy-stock';

describe('PharmacyStock', () => {
  let component: PharmacyStock;
  let fixture: ComponentFixture<PharmacyStock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PharmacyStock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PharmacyStock);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
