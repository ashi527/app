import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
@Component({
  selector: 'app-view-add-employee',
  templateUrl: './view-add-employee.page.html',
  styleUrls: ['./view-add-employee.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IonContent],
})
export class ViewAddEmployeePage {}
