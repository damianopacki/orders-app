import { toast } from 'ngx-sonner';

import { SonnerNotifier } from './sonner-notifier';

vi.mock('ngx-sonner', () => {
  const toastFn = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
  return { toast: toastFn };
});

describe('SonnerNotifier', () => {
  let notifier: SonnerNotifier;

  beforeEach(() => {
    vi.clearAllMocks();
    notifier = new SonnerNotifier();
  });

  it('shows a default toast when no type is given', () => {
    notifier.show('Hello');

    expect(vi.mocked(toast)).toHaveBeenCalledWith('Hello', undefined);
  });

  it('shows a success toast with the requested duration', () => {
    notifier.show('Done', { type: 'success', duration: 3000 });

    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Done', { duration: 3000 });
  });

  it('shows an error toast', () => {
    notifier.show('Oops', { type: 'error' });

    expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Oops', undefined);
  });

  it('shows an info toast', () => {
    notifier.show('FYI', { type: 'info' });

    expect(vi.mocked(toast.info)).toHaveBeenCalledWith('FYI', undefined);
  });
});
