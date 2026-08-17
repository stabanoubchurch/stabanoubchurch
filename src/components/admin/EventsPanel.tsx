import { useState } from "react";

import { Card, Field, GhostButton, PrimaryButton, inputClass } from "./primitives";
import { useDeleteRow, useRows, useSaveRow } from "./useCrud";
import { formatLongDate, formatTime } from "@/lib/parish-format";
import { EVENT_CATEGORIES, categoryMeta } from "@/lib/event-categories";

type EventRow = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  published: boolean;
  category: string;
  recurring: boolean;
  repeat_until: string | null;
};

const blank = (): EventRow => ({
  id: "",
  title: "",
  description: "",
  location: "",
  event_date: new Date().toISOString().slice(0, 10),
  start_time: "",
  end_time: "",
  published: true,
  category: "other_services",
  recurring: false,
  repeat_until: "",
});

export function EventsPanel() {
  const { data: events = [], isPending } = useRows<EventRow>(
    "events",
    "id, title, description, location, event_date, start_time, end_time, published, category, recurring, repeat_until",
    [{ column: "event_date", ascending: false }, { column: "start_time" }],
  );
  const save = useSaveRow("events");
  const remove = useDeleteRow("events");
  const [draft, setDraft] = useState<EventRow | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    const payload = {
      ...rest,
      location: rest.location || null,
      start_time: rest.start_time || null,
      end_time: rest.end_time || null,
      repeat_until: rest.recurring ? rest.repeat_until || null : null,
    };
    await save.mutateAsync(id ? { id, ...payload } : payload);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-primary">Calendar Events</h2>
        <PrimaryButton onClick={() => setDraft(blank())}>Add event</PrimaryButton>
      </div>

      {draft ? (
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  className={inputClass}
                  value={draft.location ?? ""}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={draft.event_date}
                  onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start time">
                  <input
                    type="time"
                    className={inputClass}
                    value={draft.start_time?.slice(0, 5) ?? ""}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                  />
                </Field>
                <Field label="End time">
                  <input
                    type="time"
                    className={inputClass}
                    value={draft.end_time?.slice(0, 5) ?? ""}
                    onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                  />
                </Field>
              </div>
            </div>
            <Field label="Description">
              <textarea
                rows={4}
                className={inputClass}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {EVENT_CATEGORIES.map((cat) => {
                  const active = draft.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setDraft({ ...draft, category: cat.value })}
                      className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${active ? "border-primary bg-secondary font-semibold text-primary" : "border-border text-primary hover:bg-secondary"}`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden
                      />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, recurring: false, repeat_until: "" })}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${!draft.recurring ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:bg-secondary"}`}
                >
                  One-off event
                </button>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, recurring: true })}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${draft.recurring ? "border-primary bg-primary text-primary-foreground" : "border-border text-primary hover:bg-secondary"}`}
                >
                  Repeats weekly
                </button>
              </div>
              {draft.recurring ? (
                <Field label="Repeat until (optional)">
                  <input
                    type="date"
                    className={inputClass}
                    value={draft.repeat_until ?? ""}
                    onChange={(e) => setDraft({ ...draft, repeat_until: e.target.value })}
                  />
                </Field>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm text-primary">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
              />
              Published
            </label>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save event"}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setDraft(null)}>
                Cancel
              </GhostButton>
            </div>
            {save.error ? (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            ) : null}
          </form>
        </Card>
      ) : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">
                    <span
                      className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                      style={{ backgroundColor: categoryMeta(event.category).color }}
                      aria-hidden
                    />
                    {event.title}{" "}
                    {!event.published ? (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {categoryMeta(event.category).label} · {formatLongDate(event.event_date)} ·{" "}
                    {formatTime(event.start_time)}
                    {event.recurring ? " · repeats weekly" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setDraft(event)}>Edit</GhostButton>
                  <GhostButton
                    onClick={() => {
                      if (confirm(`Delete ${event.title}?`)) remove.mutate(event.id);
                    }}
                  >
                    Delete
                  </GhostButton>
                </div>
              </div>
            </Card>
          ))}
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}