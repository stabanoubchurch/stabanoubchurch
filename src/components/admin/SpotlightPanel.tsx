import { useState } from "react";

import { Card, Field, GhostButton, PrimaryButton, inputClass } from "./primitives";
import { MediaInput } from "./MediaInput";
import { useDeleteRow, useRows, useSaveRow } from "./useCrud";
import { formatLongDate } from "@/lib/parish-format";

type PostRow = {
  id: string;
  title: string;
  caption: string;
  image_url: string | null;
  avatar_url: string | null;
  service_name: string | null;
  posted_on: string;
  published: boolean;
};

const blank = (): PostRow => ({
  id: "",
  title: "",
  caption: "",
  image_url: null,
  avatar_url: null,
  service_name: "",
  posted_on: new Date().toISOString().slice(0, 10),
  published: true,
});

export function SpotlightPanel() {
  const { data: posts = [], isPending } = useRows<PostRow>(
    "spotlight_posts",
    "id, title, caption, image_url, avatar_url, service_name, posted_on, published",
    [{ column: "posted_on", ascending: false }],
  );
  const save = useSaveRow("spotlight_posts");
  const remove = useDeleteRow("spotlight_posts");
  const [draft, setDraft] = useState<PostRow | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const { id, ...rest } = draft;
    const payload = { ...rest, service_name: rest.service_name || null };
    await save.mutateAsync(id ? { id, ...payload } : payload);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-primary">Service Spotlight</h2>
        <PrimaryButton onClick={() => setDraft(blank())}>Add post</PrimaryButton>
      </div>

      {draft ? (
        <Card>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <Field label="Service name">
                <input
                  className={inputClass}
                  value={draft.service_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, service_name: e.target.value })}
                />
              </Field>
              <Field label="Posted on">
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={draft.posted_on}
                  onChange={(e) => setDraft({ ...draft, posted_on: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Caption">
              <textarea
                rows={4}
                className={inputClass}
                value={draft.caption}
                onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
              />
            </Field>
            <Field label="Profile picture">
              <MediaInput
                value={draft.avatar_url}
                folder="spotlight-avatars"
                onChange={(avatar_url) => setDraft({ ...draft, avatar_url })}
              />
            </Field>
            <Field label="Photo">
              <MediaInput
                value={draft.image_url}
                folder="spotlight"
                onChange={(image_url) => setDraft({ ...draft, image_url })}
              />
            </Field>
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
                Save post
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
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">
                    {post.title || post.caption.slice(0, 60) || "Untitled post"}{" "}
                    {!post.published ? (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatLongDate(post.posted_on)}
                    {post.service_name ? ` · ${post.service_name}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <GhostButton onClick={() => setDraft(post)}>Edit</GhostButton>
                  <GhostButton
                    onClick={() => {
                      if (confirm("Delete this post?")) remove.mutate(post.id);
                    }}
                  >
                    Delete
                  </GhostButton>
                </div>
              </div>
            </Card>
          ))}
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spotlight posts yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}