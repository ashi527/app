import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewEmployeePage } from './view-employee.page';

describe('ViewEmployeePage', () => {
  let component: ViewEmployeePage;
  let fixture: ComponentFixture<ViewEmployeePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewEmployeePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
