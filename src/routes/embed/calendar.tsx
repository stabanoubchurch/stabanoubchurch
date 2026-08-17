import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { EmbedShell } from "@/components/embed/EmbedShell";
import { getEvents } from "@/lib/parish.functions";
import { EVENT_CATEGORIES, categoryMeta } from "@/lib/event-categories";
import {
  DAY_NAMES,
  MONTH_NAMES,
  dateKey,
  formatLongDate,
  formatTime,
  monthGrid,
  monthKey,
} from "@/lib/parish-format";

export const Route = createFileRoute("/embed/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar" },
      {
        name: "description",
        content: "Monthly parish calendar — tap any day to see the full timetable of events.",
      },
      { property: "og:title", content: "Calendar" },
      {
        property: "og:description",
        content: "Monthly parish calendar — tap any day to see the full timetable of events.",
      },
    ],
  }),
  component: CalendarEmbed,
});

function CalendarEmbed() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(dateKey(today));

  const month = monthKey(cursor);
  const { data: events = [], isPending } = useQuery({
    queryKey: ["events", month],
    queryFn: () => getEvents({ data: { month } }),
  });

  const grid = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const selectedEvents = events.filter((event) => event.event_date === selected);

  const step = (delta: number) => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(next);
    setSelected(dateKey(next));
  };

  return (
    <EmbedShell title="Calendar" intro="Select a day to see everything happening.">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded-md border border-border p-2 text-primary transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-2xl text-primary">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded-md border border-border p-2 text-primary transition-colors hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-2">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === cursor.getMonth();
            const dayEvents = events.filter((event) => event.event_date === key);
            const count = dayEvents.length;
            const dots = [...new Set(dayEvents.map((e) => categoryMeta(e.category).color))].slice(
              0,
              4,
            );
            const firstColor = dots[0];
            const isSelected = key === selected;
            const isToday = key === dateKey(today);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-label={`${formatLongDate(key)}, ${count} events`}
                aria-pressed={isSelected}
                className={[
                  "flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-transparent hover:bg-secondary",
                  inMonth ? "text-foreground" : "text-muted-foreground/50",
                  isToday && !isSelected ? "border-gold" : "",
                ].join(" ")}
                style={!isSelected && firstColor ? { backgroundColor: `${firstColor}15` } : undefined}
              >
                <span className={isSelected ? "font-semibold" : ""}>{day.getDate()}</span>
                <span className="mt-1.5 flex h-2 gap-1">
                  {dots.map((color, i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full ring-1 ring-black/10"
                      style={{
                        backgroundColor: isSelected ? "var(--primary-foreground)" : color,
                      }}
                      aria-hidden
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          {EVENT_CATEGORIES.map((cat) => (
            <li key={cat.value} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
                aria-hidden
              />
              {cat.label}
            </li>
          ))}
        </ul>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-6">
        <h3 className="text-xl text-primary">{formatLongDate(selected)}</h3>
        {isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading events…</p>
        ) : selectedEvents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing scheduled for this day.</p>
        ) : (
          <ol className="mt-4 divide-y divide-border border-t border-border">
            {selectedEvents.map((event) => (
              <li
                key={event.id}
                className="flex gap-4 border-l-4 py-4 pl-3"
                style={{ borderLeftColor: categoryMeta(event.category).color }}
              >
                <div className="w-24 shrink-0 text-sm font-semibold text-gold">
                  {formatTime(event.start_time)}
                  {event.end_time ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      until {formatTime(event.end_time)}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{event.title}</p>
                  <p
                    className="mt-1 text-xs font-semibold"
                    style={{ color: categoryMeta(event.category).color }}
                  >
                    {categoryMeta(event.category).label}
                  </p>
                  {event.location ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {event.location}
                    </p>
                  ) : null}
                  {event.description ? (
                    <p className="mt-2 whitespace-pre-line text-sm text-slate">
                      {event.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </EmbedShell>
  );
}