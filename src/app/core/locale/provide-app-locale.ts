import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { LOCALE_ID, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

export const APP_LOCALE = 'pl';

// Pipes (DecimalPipe, DatePipe) format with LOCALE_ID, which needs its locale data
// registered first — keeping both in one provider means they can't drift apart.
export function provideAppLocale(): EnvironmentProviders {
  registerLocaleData(localePl, APP_LOCALE);
  return makeEnvironmentProviders([{ provide: LOCALE_ID, useValue: APP_LOCALE }]);
}
