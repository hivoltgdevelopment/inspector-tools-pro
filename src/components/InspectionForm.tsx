import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type InspectionFormValues = {
  address: string;
  date: string; // ISO
  notes: string;
};

type Props = {
  onSubmitted?: (id: string) => void;
};

function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

// Very light fake API to demo the shape.
// Replace with your real submit + media APIs (Supabase, etc.)
async function submitInspectionApi(payload: {
  values: InspectionFormValues;
  media: File[];
}): Promise<{ id: string }> {
  // TODO: wire to Supabase edge function or direct table inserts + storage uploads
  await new Promise((r) => setTimeout(r, 300));
  return { id: crypto.randomUUID() };
}

export default function InspectionForm({ onSubmitted }: Props) {
  const [values, setValues] = useState<InspectionFormValues>({
    address: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [media, setMedia] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const online = useOnline();

  // ===== Voice-to-form (notes field) =====
  const recognitionRef = useRef<SpeechRecognition | null>(null as any);
  useEffect(() => {
    if (!voiceEnabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null as any;
      }
      return;
    }
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return; // unsupported; UI still shows toggle but no effect

    const rec: SpeechRecognition = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += chunk + " ";
      }
      if (finalText) {
        setValues((v) => ({ ...v, notes: (v.notes ? v.notes + " " : "") + finalText.trim() }));
      }
    };

    rec.onend = () => setListening(false);
    recognitionRef.current = rec;

    return () => {
      try {
        rec.stop();
      } catch {}
      recognitionRef.current = null as any;
    };
  }, [voiceEnabled]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        // some browsers throw if called too quickly
      }
    }
  }, [listening]);

  // ===== Form helpers =====
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const onAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setMedia((m) => [...m, ...Array.from(e.target.files!)]);
  };

  const removeMediaAt = (idx: number) => {
    setMedia((m) => m.filter((_, i) => i !== idx));
  };

  const validation = useMemo(() => {
    return (v: InspectionFormValues) => {
      const errs: Record<string, string> = {};
      if (!v.address.trim()) errs.address = "Address is required.";
      if (!v.date?.trim()) errs.date = "Date is required.";
      return errs;
    };
  }, []);

  // ===== Submit flow with offline queue =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valErrs = validation(values);
    setErrors(valErrs);
    if (Object.keys(valErrs).length) return;

    setSubmitting(true);
    try {
      // Lazy import to keep tests happy and avoid idb-keyval loading when not needed
      const queue = await import("../offline/queue").catch(() => null as any);

      if (online) {
        // Online: try real submit first
        const { id } = await submitInspectionApi({ values, media });

        // If we still maintain a queue for resilience, flush after success
        if (queue?.flushQueue) {
          await queue.flushQueue(async (item: any) => {
            // Replace with real upload path
            await submitInspectionApi({ values: item.meta?.values ?? values, media: [item.file] });
          });
        }

        onSubmitted?.(id);
        // Reset
        setMedia([]);
        setValues((v) => ({ ...v, notes: "" }));
      } else {
        // Offline: queue the inspection & media; a separate effect will flush
        if (queue?.enqueueUpload) {
          // Queue each file; you could also queue a combined inspection payload
          for (const file of media) {
            await queue.enqueueUpload({
              id: crypto.randomUUID(),
              file,
              meta: { values },
            });
          }
        }
        alert("You're offline. Inspection and media were queued and will sync when reconnected.");
        onSubmitted?.(crypto.randomUUID());
        setMedia([]);
        setValues((v) => ({ ...v, notes: "" }));
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed. Your data may be saved offline and retried.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-flush when we come online
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!online) return;
      try {
        const queue = await import("../offline/queue").catch(() => null as any);
        if (!queue?.flushQueue) return;
        await queue.flushQueue(async (item: any) => {
          if (cancelled) return;
          await submitInspectionApi({ values: item.meta?.values ?? values, media: [item.file] });
        });
      } catch (e) {
        // swallow; will retry next online event
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, values]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">Property address</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2"
          name="address"
          value={values.address}
          onChange={onChange}
          placeholder="123 Desert Vista Dr"
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium">Inspection date</label>
        <input
          type="date"
          className="mt-1 w-full rounded-md border px-3 py-2"
          name="date"
          value={values.date}
          onChange={onChange}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Notes</label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              Voice input
            </label>
            <button
              type="button"
              onClick={toggleListening}
              disabled={!voiceEnabled}
              className="rounded-md border px-2 py-1 text-sm"
              aria-pressed={listening}
              title={voiceEnabled ? "Toggle voice capture" : "Enable Voice input first"}
            >
              {listening ? "Stop" : "Speak"}
            </button>
          </div>
        </div>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          name="notes"
          value={values.notes}
          onChange={onChange}
          rows={5}
          placeholder="Observations, anomalies, maintenance items..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Photos / Media</label>
        <input
          className="mt-1"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={onAddMedia}
        />
        {media.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {media.map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  className="text-red-600 underline"
                  onClick={() => removeMediaAt(i)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {!online && (
          <p className="mt-2 text-xs text-amber-700">
            You’re offline — submissions will be queued and auto‑sent when you reconnect.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit inspection"}
        </button>
        <span className={`text-xs ${online ? "text-green-700" : "text-amber-700"}`}>
          Status: {online ? "Online" : "Offline (queued)"}
        </span>
      </div>
    </form>
  );
}
