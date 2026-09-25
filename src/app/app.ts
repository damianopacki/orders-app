import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

import { ThemeService } from '@core/theme/theme';
import { ThemeToggle } from '@shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly themeService = inject(ThemeService);
}
