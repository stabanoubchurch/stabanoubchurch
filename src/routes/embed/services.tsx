import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";

import { EmbedShell, EmptyState } from "@/components/embed/EmbedShell";
import { getServices } from "@/lib/parish.functions";
import { DAY_NAMES, formatTime } from "@/lib/parish-format";

const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => getServices(),
});

export const Route = createFileRoute("/embed/services")({
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQuery),
  head: () => ({
    meta: [
      { title: "Church Services & Times" },
      {
        name: "description",
        content: "Every service offered by the parish, explained, with the times they are held.",
      },
      { property: "og:title", content: "Church Services & Times" },
      {
        property: "og:description",
        content: "Every service offered by the parish, explained, with the times they are held.",
      },
    ],
  }),
  component: ServicesEmbed,
});

function ServicesEmbed() {
  const { data: services } = useSuspenseQuery(servicesQuery);

  return (
    <EmbedShell
      title="Church Services"
      intro="What each service is, and when you can join us for it."
    >
      {services.length === 0 ? (
        <EmptyState message="No services have been added yet." />
      ) : (
        <div className="space-y-6">
          {services.map((service) => (
            <article key={service.id} className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl text-primary">{service.name}</h2>
              {service.description ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate">
                  {service.description}
                </p>
              ) : null}
              {service.times.length > 0 ? (
                <ul className="mt-5 divide-y divide-border border-t border-border">
                  {service.times.map((time) => (
                    <li
                      key={time.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="font-semibold text-primary">
                        {DAY_NAMES[time.day_of_week] ?? "Weekly"}
                      </span>
                      <span className="text-gold font-semibold">{formatTime(time.start_time)}</span>
                      {time.note ? (
                        <span className="w-full text-muted-foreground">{time.note}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-sm text-muted-foreground">Times to be confirmed.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </EmbedShell>
  );
}