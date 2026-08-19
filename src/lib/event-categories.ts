export type EventCategory =
  | "liturgies"
  | "youth_bible_study"
  | "sunday_school"
  | "other_services"
  | "feasts_fasts"
  | "church_events";

export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "liturgies", label: "Liturgies", color: "var(--cat-liturgies)" },
  { value: "youth_bible_study", label: "Youth and Bible Study", color: "var(--cat-youth-bible-study)" },
  { value: "sunday_school", label: "Sunday School", color: "var(--cat-sunday-school)" },
  { value: "other_services", label: "Other Services", color: "var(--cat-other-services)" },
  { value: "feasts_fasts", label: "Feasts and Fasts", color: "var(--cat-feasts-fasts)" },
  { value: "church_events", label: "Church Events", color: "var(--cat-church-events)" },
];

export function categoryMeta(value: string | null | undefined) {
  return (
    EVENT_CATEGORIES.find((c) => c.value === value) ??
    EVENT_CATEGORIES.find((c) => c.value === "other_services")!
  );
}
