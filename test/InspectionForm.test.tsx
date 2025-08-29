import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import InspectionForm from '@/components/InspectionForm';

<<<<<<< ours
describe('InspectionForm voice input', () => {
=======
// SpeechRecognition mock helper
class MockRecognition {
  lang = '';
  interimResults = false;
  continuous = false;
  onresult: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

const setupSpeechRecognition = () => {
  let lastInstance: MockRecognition | null = null;
  const recognitionMock = vi.fn(() => {
    lastInstance = new MockRecognition();
    return lastInstance;
  });
  (window as any).SpeechRecognition = recognitionMock;
  (window as any).webkitSpeechRecognition = recognitionMock;
  return { recognitionMock, get last() { return lastInstance; } };
};

describe('InspectionForm', () => {
>>>>>>> theirs
  beforeEach(() => {
    vi.restoreAllMocks();
  });

<<<<<<< ours
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
=======
  it('records text via Web Speech API', async () => {
    const user = userEvent.setup();
    const sr = setupSpeechRecognition();
>>>>>>> theirs

    render(<InspectionForm />);

    await user.click(screen.getByLabelText(/voice input/i));
    await user.click(screen.getByRole('button', { name: /speak/i }));
<<<<<<< ours
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
=======
    expect(sr.recognitionMock).toHaveBeenCalled();

    const result: any = [{ transcript: 'recorded text' }];
    result.isFinal = true;
    await act(async () => {
      sr.last?.onresult?.({ resultIndex: 0, results: [result] } as any);
    });

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(
          'Observations, anomalies, maintenance items...'
        )
      ).toHaveValue('recorded text')
>>>>>>> theirs
    );
  });
});

<<<<<<< ours
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
=======
  it('disables Speak button until voice input enabled', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    expect(speakBtn).toBeDisabled();

    await user.click(screen.getByLabelText(/voice input/i));
    expect(screen.getByRole('button', { name: /speak/i })).toBeEnabled();
  });

  it('lists uploaded media files', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const label = screen.getByText('Photos / Media');
    const input = label.nextElementSibling as HTMLInputElement;
    const file = new File(['hi'], 'test.png', { type: 'image/png' });
>>>>>>> theirs
    await user.upload(input, file);

    expect(await screen.findByText('test.png')).toBeInTheDocument();
  });

<<<<<<< ours
  it('submits offline: queues uploads, shows toast, clears media', async () => {
    const user = userEvent.setup();

    // Simulate offline
=======
  it('shows offline notice when offline', () => {
>>>>>>> theirs
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    render(<InspectionForm />);

<<<<<<< ours
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

    // Sees offline toast messaging (rendered by sonner)
    await screen.findByText(/submissions will be queued and auto/i);

    // Media should be cleared after offline submit
    await waitFor(() => expect(screen.queryByText('offline.png')).not.toBeInTheDocument());
=======
    expect(
      screen.getByText(/You’re offline — submissions will be queued/i)
    ).toBeInTheDocument();

    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      configurable: true,
    });
>>>>>>> theirs
  });
});
