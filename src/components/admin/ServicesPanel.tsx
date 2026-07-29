import { useState } from "react";

import { Card, Field, GhostButton, PrimaryButton, inputClass } from "./primitives";
import { useDeleteRow, useRows, useSaveRow } from "./useCrud";
import { DAY_NAMES, formatTime } from "@/lib/parish-format";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  published: boolean;
};

type TimeRow = {
  id: string;
  service_id: string;
  day_of_week: number;
  start_time: string;
  note: string | null;
  sort_order: number;
};

const blankService = (): ServiceRow => ({
  id: "",
  name: "",
  description: "",
  sort_order: 0,
  published: true,
});

const blankTime = (serviceId: string): TimeRow => ({
  id: "",
  service_id: serviceId,
  day_of_week: 0,
  start_time: "09:00",
  note: "",
  sort_order: 0,
});

export function ServicesPanel() {
  const { data: services = [], isPending } = useRows<ServiceRow>(
    "services",
    "id, name, description, sort_order, published",
    [{ column: "sort_order" }, { column: "name" }],
  );
  const { data: times = [] } = useRows<TimeRow>(
    "service_times",
    "id, service_id, day_of_week, start_time, note, sort_order",
    [{ column: "day_of_week" }, { column: "start_time" }],
  );
  const saveService = useSaveRow("services");
  const removeService = useDeleteRow("services", ["service_times"]);
  const saveTime = useSaveRow("service_times");
  const removeTime = useDeleteRow("service_times");

  const [draft, setDraft] = useState<ServiceRow | null>(null);
  const [timeDraft, setTimeDraft] = useState<TimeRow | null>(null);

  const submitService = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    await saveService.mutateAsync(id ? { id, ...rest } : rest);
    setDraft(null);
  };

  const submitTime = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!timeDraft) return;
    const { id, ...rest } = timeDraft;
    const payload = { ...rest, note: rest.note || null };
    await saveTime.mutateAsync(id ? { id, ...payload } : payload);
    setTimeDraft(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-primary">Services</h2>
        <PrimaryButton onClick={() => setDraft(blankService())}>Add service</PrimaryButton>
      </div>

      {draft ? (
        <Card>
          <form className="space-y-4" onSubmit={submitService}>
            <Field label="Name">
              <input
                className={inputClass}
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={5}
                className={inputClass}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-4">
              <Field label="Sort order">
                <input
                  type="number"
                  className={inputClass}
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </Field>
              <label className="mt-5 flex items-center gap-2 text-sm text-primary">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
                />
                Published
              </label>
            </div>
            <div className="flex gap-2">
              <PrimaryButton type="submit" disabled={saveService.isPending}>
                Save service
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setDraft(null)}>
                Cancel
              </GhostButton>
            </div>
            {saveService.error ? (
              <p className="text-sm text-destructive">{(saveService.error as Error).message}</p>
            ) : null}
          </form>
        </Card>
      ) : null}

      {timeDraft ? (
        <Card>
          <form className="flex flex-wrap items-end gap-3" onSubmit={submitTime}>
            <Field label="Day">
              <select
                className={inputClass}
                value={timeDraft.day_of_week}
                onChange={(e) => setTimeDraft({ ...timeDraft, day_of_week: Number(e.target.value) })}
              >
                {DAY_NAMES.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start time">
              <input
                type="time"
                required
                className={inputClass}
                value={timeDraft.start_time.slice(0, 5)}
                onChange={(e) => setTimeDraft({ ...timeDraft, start_time: e.target.value })}
              />
            </Field>
            <Field label="Note">
              <input
                className={inputClass}
                value={timeDraft.note ?? ""}
                onChange={(e) => setTimeDraft({ ...timeDraft, note: e.target.value })}
              />
            </Field>
            <PrimaryButton type="submit" disabled={saveTime.isPending}>
              Save time
            </PrimaryButton>
            <GhostButton type="button" onClick={() => setTimeDraft(null)}>
              Cancel
            </GhostButton>
          </form>
        </Card>
      ) : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">
                    {service.name}{" "}
                    {!service.published ? (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    ) : null}
                  </p>
                  <p className="line-clamp-2 max-w-lg text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setDraft(service)}>Edit</GhostButton>
                  <GhostButton onClick={() => setTimeDraft(blankTime(service.id))}>
                    Add time
                  </GhostButton>
                  <GhostButton
                    onClick={() => {
                      if (confirm(`Delete ${service.name} and its times?`))
                        removeService.mutate(service.id);
                    }}
                  >
                    Delete
                  </GhostButton>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {times
                  .filter((time) => time.service_id === service.id)
                  .map((time) => (
                    <li key={time.id} className="flex items-center justify-between gap-3">
                      <span className="text-slate">
                        {DAY_NAMES[time.day_of_week]} · {formatTime(time.start_time)}
                        {time.note ? ` · ${time.note}` : ""}
                      </span>
                      <span className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTimeDraft(time)}
                          className="text-xs text-gold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTime.mutate(time.id)}
                          className="text-xs text-gold hover:underline"
                        >
                          Delete
                        </button>
                      </span>
                    </li>
                  ))}
                {times.filter((time) => time.service_id === service.id).length === 0 ? (
                  <li className="text-muted-foreground">No times set.</li>
                ) : null}
              </ul>
            </Card>
          ))}
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}