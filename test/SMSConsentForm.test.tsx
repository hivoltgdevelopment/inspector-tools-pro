import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
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

    await act(async () => {
      await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /submit/i }));
    });

    await screen.findByText('Consent recorded successfully.');
  });

  it('requires explicit consent', async () => {
    const user = userEvent.setup();
    render(<SMSConsentForm />);

    await act(async () => {
      await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
      await user.click(screen.getByRole('button', { name: /submit/i }));
    });

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('You must explicitly consent to receive SMS messages.');
  });

  it('shows error when request fails', async () => {
    const user = userEvent.setup();
    // Simulate non-ok response from backend
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false } as Response);

    render(<SMSConsentForm />);

    await act(async () => {
      await user.type(screen.getByPlaceholderText('Full name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('Phone number'), '+15551234567');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Assert inline error message inside the form container
    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent('Failed to save consent.');

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
