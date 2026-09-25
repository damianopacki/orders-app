import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Signal, WritableSignal, effect, inject, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'orders-app-theme';
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkSchemeQuery = window.matchMedia(DARK_SCHEME_QUERY);

  private hasManualPreference: boolean;
  private readonly themeSignal: WritableSignal<Theme>;
  readonly theme: Signal<Theme>;

  constructor() {
    const storedTheme = readStoredTheme();
    this.hasManualPreference = storedTheme !== null;
    this.themeSignal = signal<Theme>(storedTheme ?? (this.darkSchemeQuery.matches ? 'dark' : 'light'));
    this.theme = this.themeSignal.asReadonly();

    effect(() => {
      const theme = this.themeSignal();
      this.document.documentElement.setAttribute('data-theme', theme);
      this.document.documentElement.style.colorScheme = theme;
    });

    const handleSchemeChange = (event: MediaQueryListEvent): void => {
      if (!this.hasManualPreference) {
        this.themeSignal.set(event.matches ? 'dark' : 'light');
      }
    };

    this.darkSchemeQuery.addEventListener('change', handleSchemeChange);
    inject(DestroyRef).onDestroy(() => this.darkSchemeQuery.removeEventListener('change', handleSchemeChange));
  }

  setTheme(theme: Theme): void {
    this.hasManualPreference = true;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.themeSignal.set(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'dark' ? 'light' : 'dark');
  }
}
