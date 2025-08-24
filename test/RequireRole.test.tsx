import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import RequireRole from '@/components/RequireRole';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('RequireRole', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when role allowed', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { user_metadata: { role: 'client' } } } },
    });
    render(
      <RequireRole roles={['client']}>
        <div>secret</div>
      </RequireRole>
    );
    expect(await screen.findByText('secret')).toBeInTheDocument();
  });

  it('blocks when role not allowed', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { user_metadata: { role: 'inspector' } } } },
    });
    render(
      <RequireRole roles={['client']}>
        <div>secret</div>
      </RequireRole>
    );
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });
});
