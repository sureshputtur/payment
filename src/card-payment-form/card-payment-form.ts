import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule,TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-card-payment-form',
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './card-payment-form.html',
  styleUrl: './card-payment-form.scss',
})
export class CardPaymentForm implements OnInit{
  //Injectors Start
  private readonly fb = inject(FormBuilder);
  private readonly translocoService: TranslocoService = inject(TranslocoService);
  //Injectors End

  paymentForm: FormGroup;
  isProcessing = signal(false);
  // Validation pattern supporting both 15‑digit and 16‑digit card numbers; American Express uses 15 digits
  CARD_PATTERN = /^(?:\d{4} ){3}\d{3,4}$|^\d{15,16}$/;
  paymentStatus: string | undefined;


  @Input() set lang(value: string) {
    if (value) this.translocoService.setActiveLang(value);
  }

  @Input() themeColor: string = '#0d6efd'; // Blue color code

  constructor() {
    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(this.CARD_PATTERN)]],
      expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/?([0-9]{2})$'), this.expiryValidator]],
      cvc: ['', [Validators.required, Validators.maxLength(3), Validators.pattern('^[0-9]{3,4}$')]],
      postalCode: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^\d{5}(-\d{4})?$/)]]
    });
  }

  ngOnInit(): void {
    const token = 'test1234';
    this.loadPaymentForm(token); // ToDO: Token should get from api response.
  }

  async loadPaymentForm(token: string) {
    if(!token) return;
    try{
      const data: any = await this.getCardDetailsWithToken(token);
      this.paymentForm.patchValue({
        cardNumber: data.cardNumber.match(/.{1,4}/g)?.join(' '),
        expiry: data.expiry,
        postalCode: data.postalCode
      });
    } finally { }
  }
  getCardDetailsWithToken(token: string) {
    return {
      cardNumber: '4000056655665556',
      expiry: '12/27',
      postalCode: '06614'
    }
  }

  expiryValidator(control: any) {
    const val = control.value?.replace('/', '');
    if (!val || val.length !== 4) return { pattern: true };

    const month = parseInt(val.substring(0, 2));
    const year = parseInt(val.substring(2, 4));
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100; // To get year in two digits

    return (year < currentYear || (year === currentYear && month < currentMonth)) ? { expired: true } : null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.paymentForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  hasError(fieldName: string, errorType: string): boolean {
    return !!this.paymentForm.get(fieldName)?.hasError(errorType);
  }

  onCardInput(event: Event) {
    const input = event.target as HTMLInputElement;
    //To remove everything except numbers
    let trimmed = input.value.replace(/\s+/g, '');
    // To create chunks of 1 to 4 characters
    const sections = trimmed.match(/.{1,4}/g);
    const formatted = sections ? sections.join(' ') : trimmed;
    this.paymentForm.get('cardNumber')?.patchValue(formatted, { emitEvent: false });
  }

  resetFormAndEnableForm() {
    this.paymentForm.reset();
    this.paymentStatus= '';
  }

  async onSubmit() {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid || this.isProcessing()) return;
    this.isProcessing.set(true);
    const rawData = this.paymentForm.value;
    //ToDO: In generate we need to utilize library or api call to generate secureToken.
    // Generating token in UI is completly In Secure as client script is visible under network tab.
    // For just simulation added below code.
    const secureToken = btoa(`tok_${Date.now()}_${rawData.cardNumber.slice(-4)}`);

    try {
      await this.paymentApiCall(secureToken);
      this.paymentStatus = 'success';
      this.isProcessing.set(false);
    } catch (err) {
      this.paymentStatus = 'failed';
      this.isProcessing.set(false);
    } finally {
      this.isProcessing.set(false);
    }
  }

  // Dummy API Integration
  private paymentApiCall(token: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random()*100 > 5 // ToDo: If random number is less than 5 then will reject
          ? resolve({ success: true, tokenId: token, status: 'PROCESSED' })
          : reject('Error');
      }, 1500);
    });
  }
}
