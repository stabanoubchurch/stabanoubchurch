export type EventCategory =
  | "liturgies"
  | "bible_study"
  | "sunday_school"
  | "youth_meetings"
  | "other_services"
  | "church_events"
  | "feasts"
  | "fasts";

export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "liturgies", label: "Liturgies", color: "var(--cat-liturgies)" },
  { value: "bible_study", label: "Bible study", color: "var(--cat-bible-study)" },
  { value: "sunday_school", label: "Sunday school", color: "var(--cat-sunday-school)" },
  { value: "youth_meetings", label: "Youth meetings", color: "var(--cat-youth-meetings)" },
  { value: "other_services", label: "Other services", color: "var(--cat-other-services)" },
  { value: "church_events", label: "Church events", color: "var(--cat-church-events)" },
  { value: "feasts", label: "Feasts", color: "var(--cat-feasts)" },
  { value: "fasts", label: "Fasts", color: "var(--cat-fasts)" },
];

export function categoryMeta(value: string | null | undefined) {
  return (
    EVENT_CATEGORIES.find((c) => c.value === value) ??
    EVENT_CATEGORIES.find((c) => c.value === "other_services")!
  );
}
