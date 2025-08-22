import { render, screen } from '@testing-library/react';
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

    // Start recording in default English
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
