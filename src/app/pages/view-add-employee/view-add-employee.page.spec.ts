import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewAddEmployeePage } from './view-add-employee.page';

describe('ViewAddEmployeePage', () => {
  let component: ViewAddEmployeePage;
  let fixture: ComponentFixture<ViewAddEmployeePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewAddEmployeePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
