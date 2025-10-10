import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualReports } from './annual-reports';

describe('AnnualReports', () => {
  let component: AnnualReports;
  let fixture: ComponentFixture<AnnualReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnualReports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
