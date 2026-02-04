import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CardPaymentForm } from './card-payment-form';
import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';

describe('CardPaymentForm', () => {
  let component: CardPaymentForm;
  let fixture: ComponentFixture<CardPaymentForm>;
  let translocoServiceMock: any;

  beforeEach(async () => {
    // Mock Transloco Service
    translocoServiceMock = {
      setActiveLang: jasmine.createSpy('setActiveLang'),
      selectTranslate: jasmine.createSpy('selectTranslate').and.returnValue(of(''))
    };

    await TestBed.configureTestingModule({
      imports: [CardPaymentForm, ReactiveFormsModule], // Component is standalone
      providers: [
        { provide: TranslocoService, useValue: translocoServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CardPaymentForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  // --- Input & Language Tests ---
  it('should update transloco language when lang input changes', () => {
    component.lang = 'es';
    expect(translocoServiceMock.setActiveLang).toHaveBeenCalledWith('es');
  });

  // --- Form Validation Tests ---
  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.paymentForm.valid).toBeFalse();
    });

    it('should validate 16-digit card numbers (Standard)', () => {
      const control = component.paymentForm.get('cardNumber');
      control?.setValue('1234567812345678');
      expect(control?.valid).toBeTrue();
    });

    it('should validate 15-digit card numbers (Amex)', () => {
      const control = component.paymentForm.get('cardNumber');
      control?.setValue('123456789012345');
      expect(control?.valid).toBeTrue();
    });

    it('should show error for invalid expiry date format', () => {
      const control = component.paymentForm.get('expiry');
      control?.setValue('13/25'); // Month 13 is invalid
      expect(control?.valid).toBeFalse();
    });
  });

  // --- Logic & Formatting Tests ---
  it('should format card number with spaces on input', () => {
    const event = { target: { value: '1234567812345678' } } as any;
    component.onCardInput(event);
    expect(component.paymentForm.get('cardNumber')?.value).toBe('1234 5678 1234 5678');
  });

  // --- Submission & Async Tests ---
  describe('onSubmit', () => {
    it('should not process if form is invalid', async () => {
      component.paymentForm.get('cardNumber')?.setValue('123'); // Invalid
      await component.onSubmit();
      expect(component.isProcessing).toBeFalse();
    });

    it('should set status to success on successful API call', fakeAsync(() => {
      // Fill valid data
      component.paymentForm.patchValue({
        cardNumber: '1234 5678 1234 5678',
        expiry: '12/25',
        cvc: '123',
        postalCode: '12345'
      });

      // Spy on the private mock API (casting to any to access private for testing)
      spyOn<any>(component, 'mockApiCall').and.returnValue(Promise.resolve({ success: true }));

      component.onSubmit();
      expect(component.isProcessing).toBeTrue();

      tick(1500); // Wait for the mockApiCall timeout
      expect(component.paymentStatus).toBe('success');
      expect(component.isProcessing).toBeFalse();
    }));

    it('should set status to failed if API rejects', fakeAsync(() => {
      component.paymentForm.patchValue({
        cardNumber: '1234 5678 1234 5678',
        expiry: '12/25',
        cvc: '123',
        postalCode: '12345'
      });

      spyOn<any>(component, 'mockApiCall').and.returnValue(Promise.reject('Error'));

      component.onSubmit();
      tick(1500);

      expect(component.paymentStatus).toBe('failed');
      expect(component.isProcessing).toBeFalse();
    }));
  });
});