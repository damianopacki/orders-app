import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme';

const THEME_STORAGE_KEY = 'orders-app-theme';

interface MatchMediaMock {
  matches: boolean;
  dispatchChange(matches: boolean): void;
}

function mockMatchMedia(initialMatches: boolean): MatchMediaMock {
  let listener: ((event: MediaQueryListEvent) => void) | null = null;

  const mql: MatchMediaMock = {
    matches: initialMatches,
    dispatchChange(matches: boolean) {
      mql.matches = matches;
      listener?.({ matches } as MediaQueryListEvent);
    },
  };

  const mediaQueryList: MediaQueryList = {
    get matches() {
      return mql.matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, callback: EventListenerOrEventListenerObject) => {
      listener = callback as (event: MediaQueryListEvent) => void;
    },
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };

  vi.spyOn(window, 'matchMedia').mockReturnValue(mediaQueryList);
  return mql;
}

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
    vi.restoreAllMocks();
  });

  it('starts with dark theme when no preference is stored and the system prefers dark', () => {
    mockMatchMedia(true);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('starts with light theme when no preference is stored and the system prefers light', () => {
    mockMatchMedia(false);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('light');
  });

  it('starts with the stored theme, ignoring the system preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    mockMatchMedia(false);

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });

  it('applies data-theme and color-scheme to the document element', () => {
    mockMatchMedia(true);

    TestBed.inject(ThemeService);
    TestBed.flushEffects();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('setTheme persists the choice and updates the document element', () => {
    mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.setTheme('dark');
    TestBed.flushEffects();

    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme flips between light and dark', () => {
    mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    service.toggleTheme();
    expect(service.theme()).toBe('dark');

    service.toggleTheme();
    expect(service.theme()).toBe('light');
  });

  it('follows system preference changes until the user picks a theme manually', () => {
    const mql = mockMatchMedia(false);
    const service = TestBed.inject(ThemeService);

    mql.dispatchChange(true);
    expect(service.theme()).toBe('dark');

    service.setTheme('light');
    mql.dispatchChange(true);

    expect(service.theme()).toBe('light');
  });
});
