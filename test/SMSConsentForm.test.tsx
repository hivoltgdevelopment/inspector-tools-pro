import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SMSConsentForm from '@/components/SMSConsentForm';

describe('SMSConsentForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('submits consent successfully', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

    render(<SMSConsentForm />);

    await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await screen.findByText('Consent recorded successfully.');
  });

  it('requires explicit consent', async () => {
    const user = userEvent.setup();
    render(<SMSConsentForm />);

    await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await screen.findByText('You must explicitly consent to receive SMS messages.');
  });

  it('shows error when request fails', async () => {
    const user = userEvent.setup();
    // Simulate non-ok response from backend
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response);

    render(<SMSConsentForm />);

    await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Component should surface the canonical error message
    expect(await screen.findByText('Failed to save consent.')).toHaveTextContent(
      'Failed to save consent.'
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
