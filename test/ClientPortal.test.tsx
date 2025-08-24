import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ClientPortal from '@/components/ClientPortal';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

function mockReports() {
  (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '123' } } });
  const eq = vi.fn().mockResolvedValue({ data: [{ id: '1', title: 'Report A' }], error: null });
  const select = vi.fn().mockReturnValue({ eq });
  (supabase.from as any).mockReturnValue({ select });
}

describe('ClientPortal payments flag', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows Pay invoice when payments enabled', async () => {
    vi.stubEnv('VITE_PAYMENTS_ENABLED', 'true');
    mockReports();
    render(<ClientPortal />);
    expect(await screen.findByText('Pay invoice')).toBeInTheDocument();
  });

  it('hides Pay invoice when payments disabled', async () => {
    vi.stubEnv('VITE_PAYMENTS_ENABLED', '');
    mockReports();
    render(<ClientPortal />);
    expect(await screen.findByText('Report A')).toBeInTheDocument();
    expect(screen.queryByText('Pay invoice')).not.toBeInTheDocument();
  });
});
