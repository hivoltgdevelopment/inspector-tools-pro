import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SMSAuth from '@/components/SMSAuth';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';

describe('SMSAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles happy path authentication flow', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: null });
    (supabase.auth.verifyOtp as any).mockResolvedValue({ error: null });

    render(<SMSAuth />);

    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /send code/i }));

    await screen.findByPlaceholderText('Enter code');

    await user.type(screen.getByPlaceholderText('Enter code'), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await screen.findByText('Phone number verified!');
  });

  it('validates consent before sending code', async () => {
    const user = userEvent.setup();
    render(<SMSAuth />);

    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('button', { name: /send code/i }));

    await screen.findByText('You must consent to receive SMS messages.');
  });

  it('shows error when sign in fails', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    (supabase.auth.signInWithOtp as any).mockResolvedValue({ error: { message: 'sign in failed' } });

    render(<SMSAuth />);

    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /send code/i }));

    await screen.findByText(/failed to send verification code\. ?please try again/i);
  });
});
