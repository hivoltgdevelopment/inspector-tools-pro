import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import InspectionForm from '@/components/InspectionForm';

describe('InspectionForm language switching', () => {
  it('updates prompts and recognition language based on selected language', async () => {
    const user = userEvent.setup();

    class MockRecognition {
      lang = '';
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
    }
    let lastInstance: MockRecognition | null = null;
    const recognitionMock = vi.fn(() => {
      lastInstance = new MockRecognition();
      return lastInstance;
    });
    (window as any).SpeechRecognition = recognitionMock;
    (window as any).webkitSpeechRecognition = recognitionMock;

    render(<InspectionForm />);

    // Enable voice input and start recording in default English
    await user.click(screen.getByLabelText(/enable voice input/i));
    await user.click(screen.getAllByRole('button', { name: /speak/i })[0]);
    expect(lastInstance?.lang).toBe('en-US');

    // Switch to Spanish
    await user.selectOptions(screen.getByLabelText(/language/i), 'es-ES');

    // Prompts should be in Spanish
    expect(
      screen.getByText('Verificar las puertas exteriores')
    ).toBeInTheDocument();

    // Recognition language should update
    expect(lastInstance?.lang).toBe('es-ES');
  });
});

describe('InspectionForm features', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('switches prompts with property type and persists responses', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    // Default prompt for single family
    const firstTextarea = screen.getAllByRole('textbox')[0];
    await user.type(firstTextarea, 'door ok');

    await waitFor(() =>
      expect(localStorage.getItem('inspection-single')).not.toBeNull()
    );

    expect(
      JSON.parse(localStorage.getItem('inspection-single')!)
    ).toEqual({ 'Check exterior doors': 'door ok' });

    await user.selectOptions(screen.getByLabelText(/property type/i), 'condo');
    expect(
      await screen.findByText('Inspect entryway and lobby')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')[0]).toHaveValue('');

    await user.selectOptions(screen.getByLabelText(/property type/i), 'single');
    await waitFor(() =>
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('door ok')
    );
  });

  it('records text via Web Speech API', async () => {
    const user = userEvent.setup();

    class MockRecognition {
      lang = '';
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
    }
    let lastInstance: MockRecognition | null = null;
    const recognitionMock = vi.fn(() => {
      lastInstance = new MockRecognition();
      return lastInstance;
    });
    (window as any).SpeechRecognition = recognitionMock;
    (window as any).webkitSpeechRecognition = recognitionMock;

    render(<InspectionForm />);

    await user.click(screen.getByLabelText(/enable voice input/i));
    await user.click(screen.getAllByRole('button', { name: /speak/i })[0]);
    expect(recognitionMock).toHaveBeenCalled();

    lastInstance?.onresult?.({
      results: [[{ transcript: 'recorded text' }]],
    } as any);

    await waitFor(() =>
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('recorded text')
    );
  });

  it('uploads media and attaches geolocation', async () => {
    const user = userEvent.setup();

    const getCurrentPosition = vi.fn((success) =>
      success({ coords: { latitude: 10, longitude: 20 } })
    );
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<InspectionForm />);

    const label = screen.getByText('Add Photo or Video');
    const input = label.nextElementSibling as HTMLInputElement;
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(getCurrentPosition).toHaveBeenCalled();
    expect(await screen.findByText(/10.00, 20.00/)).toBeInTheDocument();
  });

  it('queues media when offline and flushes when back online', async () => {
    const user = userEvent.setup();

    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<InspectionForm />);

    const label = screen.getByText('Add Photo or Video');
    const input = label.nextElementSibling as HTMLInputElement;
    const file = new File(['hi'], 'test.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(
      await screen.findByText('Queued • syncs when online')
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() =>
      expect(
        screen.queryByText('Queued • syncs when online')
      ).not.toBeInTheDocument()
    );
  });

  it('queues inspection form when offline and flushes when back online', async () => {
    const user = userEvent.setup();

    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    render(<InspectionForm />);

    const firstTextarea = screen.getAllByRole('textbox')[0];
    await user.type(firstTextarea, 'offline text');
    await user.click(screen.getByRole('button', { name: /submit inspection/i }));

    expect(
      await screen.findByText('Queued • syncs when online')
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('online'));

    await waitFor(() =>
      expect(
        screen.queryByText('Queued • syncs when online')
      ).not.toBeInTheDocument()
    );
  });

  it('only shows Speak buttons when voice input enabled', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    expect(screen.queryByRole('button', { name: /speak/i })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/enable voice input/i));
    expect(screen.getAllByRole('button', { name: /speak/i })).toHaveLength(3);
  });
});
