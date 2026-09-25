import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ThemeService } from '@core/theme/theme';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let fixture: ComponentFixture<ThemeToggle>;
  let toggleTheme: ReturnType<typeof vi.fn>;

  function setup(theme: 'light' | 'dark') {
    toggleTheme = vi.fn();
    const themeSignal = signal(theme);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: ThemeService,
          useValue: { theme: themeSignal, toggleTheme },
        },
      ],
    });

    fixture = TestBed.createComponent(ThemeToggle);
    fixture.detectChanges();
  }

  function getButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.theme-toggle__button');
  }

  function getInfoButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.theme-toggle__info');
  }

  function getLabel(): string {
    return fixture.nativeElement.querySelector('.theme-toggle__label').textContent.trim();
  }

  it('shows the current theme in the label, and via aria-pressed and aria-label', () => {
    setup('dark');

    expect(getLabel()).toBe('Aktualnie wybrany motyw: Ciemny');

    const button = getButton();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Przełącz na motyw jasny');
  });

  it('shows the light state', () => {
    setup('light');

    expect(getLabel()).toBe('Aktualnie wybrany motyw: Jasny');

    const button = getButton();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Przełącz na motyw ciemny');
  });

  it('exposes an info hint explaining where the theme comes from', () => {
    setup('light');

    expect(getInfoButton().getAttribute('title')).toContain('localStorage');
  });

  it('calls toggleTheme when the toggle button is clicked', () => {
    setup('light');

    getButton().click();

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('does not toggle the theme when the info button is clicked', () => {
    setup('light');

    getInfoButton().click();

    expect(toggleTheme).not.toHaveBeenCalled();
  });
});
