import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
        content: "Parish calendar in day, week or month view — see the full timetable of events.",
      },
      { property: "og:title", content: "Calendar" },
      {
        property: "og:description",
        content: "Parish calendar in day, week or month view — see the full timetable of events.",
      },
    ],
  }),
  component: CalendarEmbed,
});

type ViewMode = "day" | "week" | "month";

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function CalendarEmbed() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(dateKey(today));

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }, [selected]);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart.getTime()],
  );

  // Which months of data we need for the current view.
  const months = useMemo(() => {
    if (view === "month") return [monthKey(cursor)];
    if (view === "day") return [monthKey(selectedDate)];
    return [...new Set(weekDays.map(monthKey))];
  }, [view, cursor, selectedDate, weekDays]);

  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: ["events", month],
      queryFn: () => getEvents({ data: { month } }),
    })),
  });
  const events = results.flatMap((r) => r.data ?? []);
  const isPending = results.some((r) => r.isPending);

  const grid = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const eventsOn = (key: string) => events.filter((event) => event.event_date === key);
  const selectedEvents = eventsOn(selected);

  const step = (delta: number) => {
    if (view === "month") {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
      setCursor(next);
      setSelected(dateKey(next));
      return;
    }
    const next = addDays(selectedDate, view === "week" ? delta * 7 : delta);
    setSelected(dateKey(next));
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const headingLabel = (() => {
    if (view === "month") return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "day") return formatLongDate(selected);
    const end = addDays(weekStart, 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    return sameMonth
      ? `${weekStart.getDate()}–${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`
      : `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${end.getFullYear()}`;
  })();

  return (
    <EmbedShell title="Calendar" intro="Choose a day, week or month to see which services are on.">
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {VIEWS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setView(option.value)}
              aria-pressed={view === option.value}
              className={[
                "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                view === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-primary hover:bg-secondary",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Previous ${view}`}
            className="rounded-md border border-border p-2 text-primary transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-center text-xl text-primary sm:text-2xl">{headingLabel}</h2>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={`Next ${view}`}
            className="rounded-md border border-border p-2 text-primary transition-colors hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {view === "month" ? (
          <>
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
                const dayEvents = eventsOn(key);
                const count = dayEvents.length;
                const dots = [
                  ...new Set(dayEvents.map((e) => categoryMeta(e.category).color)),
                ].slice(0, 4);
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
                    style={
                      !isSelected && firstColor
                        ? { backgroundColor: `${firstColor}22` }
                        : undefined
                    }
                  >
                    <span className={isSelected ? "font-semibold" : ""}>{day.getDate()}</span>
                    <span className="mt-1.5 flex h-1.5 gap-1.5">
                      {dots.map((color, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full ring-1 ring-black/10"
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
          </>
        ) : null}

        {view === "week" ? (
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="grid min-w-[640px] grid-cols-7 items-start gap-2">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const dayEvents = eventsOn(key);
                const isSelected = key === selected;
                return (
                  <div
                    key={key}
                    className={[
                      "flex flex-col overflow-hidden rounded-md border transition-colors",
                      isSelected ? "border-primary bg-secondary" : "border-border bg-card",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(key)}
                      aria-pressed={isSelected}
                      className={[
                        "sticky top-0 z-10 border-b px-2 py-1.5 text-center backdrop-blur",
                        isSelected
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : "border-border bg-secondary/80 text-primary hover:bg-secondary",
                      ].join(" ")}
                    >
                      <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-80">
                        {DAY_NAMES[day.getDay()].slice(0, 3)}
                      </span>
                      <span className="block text-base font-semibold leading-tight">
                        {day.getDate()}
                      </span>
                    </button>
                    <ul className="flex-1 space-y-1 p-1.5">
                      {dayEvents.length === 0 ? (
                        <li className="py-1 text-center text-[11px] text-muted-foreground/70">—</li>
                      ) : (
                        dayEvents.map((event) => (
                          <li key={event.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(key)}
                              className="w-full rounded border-l-[4px] px-1.5 py-1 text-left text-[11px] leading-snug text-primary"
                              style={{
                                borderLeftColor: categoryMeta(event.category).color,
                                backgroundColor: `${categoryMeta(event.category).color}33`,
                              }}
                            >
                              <span className="block font-semibold">
                                {formatTime(event.start_time)}
                              </span>
                              <span className="block break-words">{event.title}</span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}


        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          {EVENT_CATEGORIES.map((cat) => (
            <li key={cat.value} className="flex items-center gap-2 rounded-md bg-white/50 px-2 py-1">
              <span
                className="h-1.5 w-1.5 rounded-full ring-1 ring-black/10"
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
                className="flex gap-4 border-l-[6px] py-4 pl-4"
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
                  <span
                    className="mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${categoryMeta(event.category).color}25`,
                      color: categoryMeta(event.category).color,
                    }}
                  >
                    {categoryMeta(event.category).label}
                  </span>
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
