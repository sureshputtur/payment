import { Component } from '@angular/core';
import { CardPaymentForm } from '../card-payment-form/card-payment-form';

@Component({
  selector: 'app-root',
  imports: [CardPaymentForm],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'payment';
}
