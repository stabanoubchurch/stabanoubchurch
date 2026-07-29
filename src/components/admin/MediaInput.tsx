import { useEffect, useState } from "react";

import { signedMediaUrl, uploadMedia } from "@/lib/parish-media";

export function MediaInput({
  value,
  folder,
  onChange,
}: {
  value: string | null;
  folder: string;
  onChange: (path: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    signedMediaUrl(value).then((url) => {
      if (active) setPreview(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <div className="flex items-start gap-3">
      {preview ? (
        <img
          src={preview}
          alt="Current upload"
          className="h-20 w-20 rounded-md border border-border object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
          None
        </div>
      )}
      <div className="space-y-1">
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              onChange(await uploadMedia(file, folder));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
          className="block text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-gold hover:underline"
          >
            Remove photo
          </button>
        ) : null}
        {busy ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}