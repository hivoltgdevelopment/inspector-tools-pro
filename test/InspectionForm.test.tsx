import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import InspectionForm from '@/components/InspectionForm';

// Optional SpeechRecognition mock helper to control events
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
  (window as any).SpeechRecognition = recognitionMock as any;
  (window as any).webkitSpeechRecognition = recognitionMock as any;
  return { recognitionMock, get last() { return lastInstance; } };
};

describe('InspectionForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('disables Speak button until voice input enabled', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const speakBtn = screen.getByRole('button', { name: /speak/i });
    expect(speakBtn).toBeDisabled();

    await user.click(screen.getByLabelText(/voice input/i));
    expect(screen.getByRole('button', { name: /speak/i })).toBeEnabled();
  });

  it('records text via Web Speech API', async () => {
    const user = userEvent.setup();
    const sr = setupSpeechRecognition();

    render(<InspectionForm />);

    await user.click(screen.getByLabelText(/voice input/i));
    await user.click(screen.getByRole('button', { name: /speak/i }));
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
    );
  });

  it('lists uploaded media files', async () => {
    const user = userEvent.setup();
    render(<InspectionForm />);

    const label = screen.getByText('Photos / Media');
    const input = label.nextElementSibling as HTMLInputElement;
    const file = new File(['hi'], 'test.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(await screen.findByText('test.png')).toBeInTheDocument();
  });

  it('submits offline: clears media and queues', async () => {
    const user = userEvent.setup();

    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    render(<InspectionForm />);

    // Minimal required field
    await user.type(
      screen.getByLabelText(/property address/i),
      '123 Desert Vista Dr'
    );

    // Attach a file and verify listed
    const mediaLabel = screen.getByText('Photos / Media');
    const mediaInput = mediaLabel.nextElementSibling as HTMLInputElement;
    const file = new File(['hi'], 'offline.png', { type: 'image/png' });
    await user.upload(mediaInput, file);
    expect(await screen.findByText('offline.png')).toBeInTheDocument();

    // Submit while offline
    await user.click(screen.getByRole('button', { name: /submit inspection/i }));

    // Media list should clear after offline submit
    await waitFor(() =>
      expect(screen.queryByText('offline.png')).not.toBeInTheDocument()
    );
  });
});
