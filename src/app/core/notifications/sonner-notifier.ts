import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

import { Notifier } from './notifier';
import type { ToastOptions } from './notifier';

@Injectable()
export class SonnerNotifier extends Notifier {
  override show(message: string, options?: ToastOptions): void {
    const data = options?.duration !== undefined ? { duration: options.duration } : undefined;

    switch (options?.type) {
      case 'success':
        toast.success(message, data);
        return;
      case 'error':
        toast.error(message, data);
        return;
      case 'info':
        toast.info(message, data);
        return;
      default:
        toast(message, data);
    }
  }
}
