import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Heart, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { EmbedShell, EmptyState } from "@/components/embed/EmbedShell";
import { getSpotlight, toggleReaction } from "@/lib/parish.functions";
import { formatLongDate } from "@/lib/parish-format";

const spotlightQuery = queryOptions({
  queryKey: ["spotlight"],
  queryFn: () => getSpotlight(),
});

export const Route = createFileRoute("/embed/spotlight")({
  loader: ({ context }) => context.queryClient.ensureQueryData(spotlightQuery),
  head: () => ({
    meta: [
      { title: "Service Spotlight" },
      {
        name: "description",
        content: "Weekly photo posts showing what our church services have been up to.",
      },
      { property: "og:title", content: "Service Spotlight" },
      {
        property: "og:description",
        content: "Weekly photo posts showing what our church services have been up to.",
      },
    ],
  }),
  component: SpotlightEmbed,
});

const VISITOR_KEY = "parish-visitor-id";
const REACTED_KEY = "parish-reactions";

function readReacted(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(REACTED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function SpotlightEmbed() {
  const { data: posts } = useSuspenseQuery(spotlightQuery);
  const queryClient = useQueryClient();
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [reacted, setReacted] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    setVisitorId(id);
    setReacted(readReacted());
  }, []);

  const react = async (postId: string, kind: "heart" | "thumbsup") => {
    if (!visitorId) return;
    const key = `${postId}:${kind}`;
    setBusy(key);
    try {
      const result = await toggleReaction({ data: { postId, visitorId, kind } });
      const nextReacted = { ...reacted, [key]: result.active };
      setReacted(nextReacted);
      localStorage.setItem(REACTED_KEY, JSON.stringify(nextReacted));
      setCounts((prev) => ({ ...prev, [key]: result.count }));
      queryClient.invalidateQueries({ queryKey: ["spotlight"] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <EmbedShell title="Service Spotlight" intro="What our services have been up to this week.">
      {posts.length === 0 ? (
        <EmptyState message="No spotlight posts yet." />
      ) : (
        <div className="mx-auto max-w-xl space-y-8">
          {posts.map((post) => {
            const heartKey = `${post.id}:heart`;
            const thumbKey = `${post.id}:thumbsup`;
            const hearts = counts[heartKey] ?? post.hearts;
            const thumbs = counts[thumbKey] ?? post.thumbsups;
            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {post.avatar_url ? (
                    <img
                      src={post.avatar_url}
                      alt={`${post.service_name || "Parish"} profile picture`}
                      loading="lazy"
                      className="h-9 w-9 shrink-0 rounded-full bg-secondary object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">
                      {(post.service_name ?? "Parish").slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">
                      {post.service_name || "Parish"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatLongDate(post.posted_on)}
                    </p>
                  </div>
                </div>
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.title || post.caption.slice(0, 80) || "Spotlight photo"}
                    loading="lazy"
                    className="aspect-square w-full bg-secondary object-cover"
                  />
                ) : null}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => react(post.id, "heart")}
                      disabled={busy === heartKey}
                      aria-pressed={!!reacted[heartKey]}
                      aria-label="Heart this post"
                      className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-gold disabled:opacity-50"
                    >
                      <Heart
                        className={`h-5 w-5 ${reacted[heartKey] ? "fill-gold text-gold" : ""}`}
                      />
                      {hearts}
                    </button>
                    <button
                      type="button"
                      onClick={() => react(post.id, "thumbsup")}
                      disabled={busy === thumbKey}
                      aria-pressed={!!reacted[thumbKey]}
                      aria-label="Thumbs up this post"
                      className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-gold disabled:opacity-50"
                    >
                      <ThumbsUp
                        className={`h-5 w-5 ${reacted[thumbKey] ? "fill-gold text-gold" : ""}`}
                      />
                      {thumbs}
                    </button>
                  </div>
                  {post.title ? (
                    <h2 className="mt-3 text-xl text-primary">{post.title}</h2>
                  ) : null}
                  {post.caption ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate">
                      {post.caption}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </EmbedShell>
  );
}