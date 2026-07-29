import { useState } from "react";

import { Card, Field, GhostButton, PrimaryButton, inputClass } from "./primitives";
import { MediaInput } from "./MediaInput";
import { useDeleteRow, useRows, useSaveRow } from "./useCrud";

type PriestRow = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  sort_order: number;
  published: boolean;
};

const blank = (): PriestRow => ({
  id: "",
  name: "",
  role: "Parish Priest",
  bio: "",
  photo_url: null,
  email: "",
  phone: "",
  sort_order: 0,
  published: true,
});

export function PriestsPanel() {
  const { data: priests = [], isPending } = useRows<PriestRow>(
    "priests",
    "id, name, role, bio, photo_url, email, phone, sort_order, published",
    [{ column: "sort_order" }, { column: "name" }],
  );
  const save = useSaveRow("priests");
  const remove = useDeleteRow("priests");
  const [draft, setDraft] = useState<PriestRow | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    await save.mutateAsync(id ? { id, ...rest } : rest);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-primary">Parish Priests</h2>
        <PrimaryButton onClick={() => setDraft(blank())}>Add priest</PrimaryButton>
      </div>

      {draft ? (
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className={inputClass}
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Role">
                <input
                  className={inputClass}
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={draft.email ?? ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Bio">
              <textarea
                rows={5}
                className={inputClass}
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              />
            </Field>
            <Field label="Photo">
              <MediaInput
                value={draft.photo_url}
                folder="priests"
                onChange={(photo_url) => setDraft({ ...draft, photo_url })}
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
              <PrimaryButton type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save priest"}
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
          {priests.map((priest) => (
            <Card key={priest.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">
                    {priest.name}{" "}
                    {!priest.published ? (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{priest.role}</p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setDraft(priest)}>Edit</GhostButton>
                  <GhostButton
                    onClick={() => {
                      if (confirm(`Delete ${priest.name}?`)) remove.mutate(priest.id);
                    }}
                  >
                    Delete
                  </GhostButton>
                </div>
              </div>
            </Card>
          ))}
          {priests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No priests added yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}