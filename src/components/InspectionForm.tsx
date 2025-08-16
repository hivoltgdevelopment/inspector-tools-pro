import React, { useEffect, useRef, useState } from 'react';

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

const propertyPrompts: Record<string, string[]> = {
  single: [
    'Check exterior doors',
    'Inspect windows for damage',
    'Review roof and gutters',
  ],
  condo: [
    'Inspect entryway and lobby',
    'Check balcony safety',
    'Test appliances',
  ],
  commercial: [
    'Check signage and lighting',
    'Inspect parking area',
    'Review HVAC system',
  ],
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

  const prompts = propertyPrompts[propertyType];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Inspection Form</h1>
        <span className={online ? 'text-green-600' : 'text-red-600'}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Property Type</label>
        <select
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
        <label className="block font-medium">Language</label>
        <select
          className="border rounded p-2 w-full"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en-US">English</option>
          <option value="es-ES">Español</option>
        </select>
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
            <button
              type="button"
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={() =>
                recordingPrompt === prompt ? stopRecording() : startRecording(prompt)
              }
            >
              {recordingPrompt === prompt ? 'Stop' : 'Speak'}
            </button>
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
    </div>
  );
}

