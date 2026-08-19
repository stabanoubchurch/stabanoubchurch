import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";

import { EmbedShell, EmptyState } from "@/components/embed/EmbedShell";
import { getPriests } from "@/lib/parish.functions";

const priestsQuery = queryOptions({
  queryKey: ["priests"],
  queryFn: () => getPriests(),
});

export const Route = createFileRoute("/embed/priests")({
  loader: ({ context }) => context.queryClient.ensureQueryData(priestsQuery),
  head: () => ({
    meta: [
      { title: "Our Parish Priests" },
      { name: "description", content: "Meet the parish priests: bios, roles and contact details." },
      { property: "og:title", content: "Our Parish Priests" },
      {
        property: "og:description",
        content: "Meet the parish priests: bios, roles and contact details.",
      },
    ],
  }),
  component: PriestsEmbed,
});

function PriestsEmbed() {
  const { data: priests } = useSuspenseQuery(priestsQuery);

  return (
    <EmbedShell title="Our Parish Priests" intro="The clergy serving our parish community.">
      {priests.length === 0 ? (
        <EmptyState message="No priests have been added yet." />
      ) : (
        <div className="space-y-6">
          {priests.map((priest) => (
            <article
              key={priest.id}
              className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-start"
            >
              <div className="h-40 w-40 shrink-0 overflow-hidden rounded-full bg-secondary">
                {priest.photo_url ? (
                  <img
                    src={priest.photo_url}
                    alt={`Portrait of ${priest.name}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-4xl text-primary/40">
                    {priest.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl text-primary">{priest.name}</h2>
                {priest.role ? (
                  <p className="mt-1 text-sm font-semibold tracking-wide text-gold uppercase">
                    {priest.role}
                  </p>
                ) : null}
                {priest.bio ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate">
                    {priest.bio}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {priest.email ? (
                    <a
                      className="inline-flex items-center gap-2 text-primary hover:text-gold"
                      href={`mailto:${priest.email}`}
                    >
                      <Mail className="h-4 w-4" aria-hidden />
                      {priest.email}
                    </a>
                  ) : null}
                  {priest.phone ? (
                    <a
                      className="inline-flex items-center gap-2 text-primary hover:text-gold"
                      href={`tel:${priest.phone.replace(/\s+/g, "")}`}
                    >
                      <Phone className="h-4 w-4" aria-hidden />
                      {priest.phone}
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </EmbedShell>
  );
}