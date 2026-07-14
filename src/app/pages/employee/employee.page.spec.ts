import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeePage } from './employee.page';

describe('EmployeePage', () => {
  let component: EmployeePage;
  let fixture: ComponentFixture<EmployeePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
