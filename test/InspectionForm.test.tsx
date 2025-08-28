import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import InspectionForm from '@/components/InspectionForm';

describe('InspectionForm voice input', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('toggles Speak button with Voice input checkbox', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    expect(speakBtn).toBeDisabled();

    await user.click(screen.getByText(/voice input/i));
    expect(screen.getByRole('button', { name: /speak/i })).toBeEnabled();
  });

  it('appends dictated text to notes when recognition produces final result', async () => {
    const user = userEvent.setup();

    class MockRecognition {
      continuous = true;
      interimResults = true;
      lang = 'en-US';
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
    }
    let lastInstance: MockRecognition | null = null;
    const recognitionMock = vi.fn(() => {
      lastInstance = new MockRecognition();
      return lastInstance as any;
    });
    (window as any).SpeechRecognition = recognitionMock;
    (window as any).webkitSpeechRecognition = recognitionMock;

    render(<InspectionForm />);

    await user.click(screen.getByLabelText(/voice input/i));
    await user.click(screen.getByRole('button', { name: /speak/i }));
    expect(recognitionMock).toHaveBeenCalled();

    // Simulate a final recognition chunk
    lastInstance?.onresult?.({
      resultIndex: 0,
      results: [
        { 0: { transcript: 'recorded text' }, isFinal: true },
      ],
    } as any);

    await waitFor(() =>
      expect(screen.getByLabelText(/notes/i)).toHaveValue('recorded text')
    );
  });
});

describe('InspectionForm media and offline behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('adds selected files to the list', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(await screen.findByText('test.png')).toBeInTheDocument();
  });

  it('submits offline: queues uploads, shows alert, clears media', async () => {
    const user = userEvent.setup();

    // Simulate offline
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<InspectionForm />);

    // Fill minimal required fields using accessible labels
    await user.type(screen.getByLabelText(/property address/i), '123 Desert Vista Dr');
    // Date defaults; ensure it remains

    // Attach a file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hi'], 'offline.png', { type: 'image/png' });
    await user.upload(input, file);
    expect(await screen.findByText('offline.png')).toBeInTheDocument();

    // Submit while offline
    await user.click(screen.getByRole('button', { name: /submit inspection/i }));

    // Sees status indicator and alert
    expect(screen.getByText(/status: offline \(queued\)/i)).toBeInTheDocument();
    expect(alertSpy).toHaveBeenCalled();

    // Media should be cleared after offline submit
    await waitFor(() => expect(screen.queryByText('offline.png')).not.toBeInTheDocument());

    alertSpy.mockRestore();
  });
});
