import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { provideAppLocale } from '@core/locale/provide-app-locale';
import { Notifier } from '@core/notifications/notifier';
import { SonnerNotifier } from '@core/notifications/sonner-notifier';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAppLocale(),
    { provide: Notifier, useClass: SonnerNotifier },
  ],
};
