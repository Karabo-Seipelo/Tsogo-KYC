import type { FunnelEvent } from "./events";

type EventName = FunnelEvent["event"];
type EventProps<E extends EventName> = Omit<
  Extract<FunnelEvent, { event: E }>,
  "event"
>;

export function track<E extends EventName>(event: E, props: EventProps<E>) {
  console.log({ event, ...props });
}
