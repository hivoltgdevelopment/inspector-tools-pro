<<<<<<< ours
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ClientPortal from '@/components/ClientPortal';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

function mockReports(data = [{ id: '1', title: 'Report A' }]) {
  (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '123' } } });
  const eq = vi.fn().mockResolvedValue({ data, error: null });
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

describe('ClientPortal UX', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('filters reports by search input', async () => {
    mockReports([
      { id: '1', title: 'Roof Report' },
      { id: '2', title: 'Basement Report' },
    ]);
    render(<ClientPortal />);
    expect(await screen.findByText('Roof Report')).toBeInTheDocument();
    const search = screen.getByPlaceholderText('Search reports...');
    await userEvent.type(search, 'base');
    expect(screen.queryByText('Roof Report')).not.toBeInTheDocument();
    expect(screen.getByText('Basement Report')).toBeInTheDocument();
  });

  it('shows legal disclaimer', async () => {
    mockReports();
    render(<ClientPortal />);
    expect(
      await screen.findByText(
        /inspection reports are provided for informational purposes/i
      )
    ).toBeInTheDocument();
  });
});
=======
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ClientPortal from '@/components/ClientPortal';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

function mockReports(data = [{ id: '1', title: 'Report A' }]) {
  (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '123' } } });
  const eq = vi.fn().mockResolvedValue({ data, error: null });
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

describe('ClientPortal UX', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('filters reports by search input', async () => {
    mockReports([
      { id: '1', title: 'Roof Report' },
      { id: '2', title: 'Basement Report' },
    ]);
    render(<ClientPortal />);
    expect(await screen.findByText('Roof Report')).toBeInTheDocument();
    const search = screen.getByPlaceholderText('Search reports...');
    await userEvent.type(search, 'base');
    expect(screen.queryByText('Roof Report')).not.toBeInTheDocument();
    expect(screen.getByText('Basement Report')).toBeInTheDocument();
  });

  it('shows legal disclaimer', async () => {
    mockReports();
    render(<ClientPortal />);
    expect(
      await screen.findByText(
        /inspection reports are provided for informational purposes/i
      )
    ).toBeInTheDocument();
  });
});
>>>>>>> theirs
