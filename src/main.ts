import 'zone.js'
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { CardPaymentForm } from './card-payment-form/card-payment-form';
import { TranslocoHttpLoader} from './core/transloco-loader'

bootstrapApplication(CardPaymentForm, {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false, // Need to pick from .env file in actual production.
      },
      loader: TranslocoHttpLoader
    })
  ]
}).catch(err => console.error(err));
