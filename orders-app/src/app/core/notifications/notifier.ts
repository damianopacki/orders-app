export interface ToastOptions {
  readonly type?: 'info' | 'success' | 'error';
  readonly duration?: number;
}

export abstract class Notifier {
  abstract show(message: string, options?: ToastOptions): void;
}
