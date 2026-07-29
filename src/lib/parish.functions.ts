import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPriests = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPriests } = await import("./parish.server");
  return loadPriests();
});

export const getEvents = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { loadEvents } = await import("./parish.server");
    return loadEvents(data.month);
  });

export const getServices = createServerFn({ method: "GET" }).handler(async () => {
  const { loadServices } = await import("./parish.server");
  return loadServices();
});

export const getSpotlight = createServerFn({ method: "GET" }).handler(async () => {
  const { loadSpotlight } = await import("./parish.server");
  return loadSpotlight();
});

export const toggleReaction = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        postId: z.string().uuid(),
        visitorId: z.string().uuid(),
        kind: z.enum(["heart", "thumbsup"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { toggleReactionForVisitor } = await import("./parish.server");
    return toggleReactionForVisitor(data);
  });