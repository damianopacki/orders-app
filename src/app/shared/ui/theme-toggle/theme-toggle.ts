import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeService } from '@core/theme/theme';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
}
