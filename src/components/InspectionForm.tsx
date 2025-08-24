import React, { useEffect, useRef, useState } from 'react';
import {
  enqueueUpload,
  getQueuedItems,
  startUploadWorker,
} from '@/lib/uploadQueue';
codex/continue-implementation-of-feature-xdvitk

main
import {
  enqueueForm,
  getQueuedForms,
  startFormWorker,
} from '@/lib/formQueue';
codex/continue-implementation-of-feature-xdvitk

main

// Minimal typings for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const propertyPrompts: Record<
  string,
  Record<'en' | 'es', string[]>
> = {
  single: {
    en: [
      'Check exterior doors',
      'Inspect windows for damage',
      'Review roof and gutters',
    ],
    es: [
      'Verificar las puertas exteriores',
      'Inspeccionar ventanas por daños',
      'Revisar techo y canaletas',
    ],
  },
  condo: {
    en: [
      'Inspect entryway and lobby',
      'Check balcony safety',
      'Test appliances',
    ],
    es: [
      'Inspeccionar entrada y vestíbulo',
      'Comprobar seguridad del balcón',
      'Probar electrodomésticos',
    ],
  },
  commercial: {
    en: [
      'Check signage and lighting',
      'Inspect parking area',
      'Review HVAC system',
    ],
    es: [
      'Revisar señalización e iluminación',
      'Inspeccionar área de estacionamiento',
      'Revisar sistema HVAC',
    ],
  },
};

const STORAGE_KEY_PREFIX = 'inspection-';

interface MediaEntry {
  url: string;
  type: string;
  timestamp: number;
  coords?: { lat: number; lon: number };
  revoke: () => void;
}

export default function InspectionForm() {
  const [propertyType, setPropertyType] = useState<string>('single');
  const [language, setLanguage] = useState<string>('en-US');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [recordingPrompt, setRecordingPrompt] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const mediaRef = useRef<MediaEntry[]>([]);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [queuedUploads, setQueuedUploads] = useState<number>(0);
  const [queuedForms, setQueuedForms] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const uploadFile = async (file: File) => {
    // TODO: integrate with backend upload endpoint
    return Promise.resolve();
  };

  const submitFormData = async (data: any) => {
    // TODO: integrate with backend submission endpoint
    return Promise.resolve();
  };

  const [queuedUploads, setQueuedUploads] = useState<number>(0);
  const [queuedForms, setQueuedForms] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  const [queued, setQueued] = useState<number>(0);
main
  const uploadFile = async (file: File) => {
    // TODO: integrate with backend upload endpoint
    return Promise.resolve();
  };

  const submitFormData = async (data: any) => {
    // TODO: integrate with backend submission endpoint
    return Promise.resolve();
  };
main

  // Load saved responses when property type changes
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + propertyType);
    setResponses(saved ? JSON.parse(saved) : {});
  }, [propertyType]);

  // Persist responses for offline usage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY_PREFIX + propertyType,
      JSON.stringify(responses)
    );
  }, [responses, propertyType]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  useEffect(() => {
codex/continue-implementation-of-feature-xdvitk

main
    getQueuedItems().then((items) => setQueuedUploads(items.length));
    const stop = startUploadWorker(uploadFile, (count) => setQueuedUploads(count));
    return stop;
  }, []);

  useEffect(() => {
    getQueuedForms().then((items) => setQueuedForms(items.length));
    const stop = startFormWorker(submitFormData, (count) => setQueuedForms(count));
codex/continue-implementation-of-feature-xdvitk
   getQueuedItems().then((items) => setQueued(items.length));
    const stop = startUploadWorker(uploadFile, (count) => setQueued(count));
main
    return stop;
  }, []);

  // Update recognition language when switching languages
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startRecording = (prompt: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setResponses((r) => ({
        ...r,
        [prompt]: r[prompt] ? r[prompt] + ' ' + transcript : transcript,
      }));
    };
    recognition.onend = () => setRecordingPrompt(null);
    recognition.start();
    recognitionRef.current = recognition;
    setRecordingPrompt(prompt);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecordingPrompt(null);
  };

  const handleMediaChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const revoke = () => URL.revokeObjectURL(url);
    const timestamp = Date.now();
    let coords: { lat: number; lon: number } | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject)
        );
        coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setGeoError(null);
      } catch (error) {
        console.error('Geolocation error:', error);
        setGeoError("Location data couldn't be retrieved");
      }
    } else {
      setGeoError("Location data couldn't be retrieved");
    }
    setMedia((m) => [...m, { url, type: file.type, timestamp, coords, revoke }]);

    if (!navigator.onLine) {
      await enqueueUpload(file);
codex/continue-implementation-of-feature-xdvitk

      main
      setQueuedUploads((q) => q + 1);
    } else {
      await uploadFile(file);
    }
  };

  const handleSubmit = async () => {
    const data = { propertyType, language, responses };
    if (!navigator.onLine) {
      await enqueueForm(data);
      setQueuedForms((q) => q + 1);
    } else {
      await submitFormData(data);
    }
codex/continue-implementation-of-feature-xdvitk

      setQueued((q) => q + 1);
    } else {
      await uploadFile(file);
    }
main
  };

  useEffect(() => {
    const prev = mediaRef.current;
    prev.forEach((item) => {
      if (!media.includes(item)) {
        item.revoke();
      }
    });
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => item.revoke());
    };
  }, []);

  const langKey = language.startsWith('es') ? 'es' : 'en';
  const prompts = propertyPrompts[propertyType][langKey];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Inspection Form</h1>
        <div className="flex items-center gap-2">
codex/continue-implementation-of-feature-xdvitk
          {queuedUploads + queuedForms > 0 && (

          {queuedUploads + queuedForms > 0 && (

          {queued > 0 && (
main
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Queued • syncs when online
            </span>
          )}
          <span className={online ? 'text-green-600' : 'text-red-600'}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="propertyType" className="block font-medium">Property Type</label>
        <select
          id="propertyType"
          className="border rounded p-2 w-full"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value="single">Single Family</option>
          <option value="condo">Condo</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="language" className="block font-medium">Language</label>
        <select
          id="language"
          className="border rounded p-2 w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en-US">English</option>
          <option value="es-ES">Español</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="voice"
          type="checkbox"
          checked={voiceEnabled}
          onChange={(e) => setVoiceEnabled(e.target.checked)}
        />
        <label htmlFor="voice" className="font-medium">
          Enable voice input
        </label>
      </div>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt} className="space-y-1">
            <label className="font-medium">{prompt}</label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={responses[prompt] || ''}
              onChange={(e) =>
                setResponses((r) => ({ ...r, [prompt]: e.target.value }))
              }
            />
            {voiceEnabled && (
              <button
                type="button"
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() =>
                  recordingPrompt === prompt
                    ? stopRecording()
                    : startRecording(prompt)
                }
              >
                {recordingPrompt === prompt ? 'Stop' : 'Speak'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Add Photo or Video</label>
        <input
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleMediaChange}
        />
        {geoError && (
          <p className="text-sm text-red-600">{geoError}</p>
        )}
        <ul className="text-sm list-disc pl-4">
          {media.map((m, i) => (
            <li key={i}>
              {new Date(m.timestamp).toLocaleString()} -
              {m.coords
                ? ` ${m.coords.lat.toFixed(2)}, ${m.coords.lon.toFixed(2)}`
                : ' location unavailable'}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={handleSubmit}
      >
        Submit Inspection
      </button>
    </div>
  );
}

