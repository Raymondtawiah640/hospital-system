import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShedulesHistory } from './shedules-history';

describe('ShedulesHistory', () => {
  let component: ShedulesHistory;
  let fixture: ComponentFixture<ShedulesHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShedulesHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShedulesHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
