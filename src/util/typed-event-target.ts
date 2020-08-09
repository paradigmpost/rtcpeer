interface AnyEventMap {
  [key: string]: Event;
}

// WARNING: this does not enforce that values of the EventMap are Event's
// to workaround this temporarily, E is defined as 'EventMap[K] & Event'
export class TypedEventTarget<EventMap extends AnyEventMap> extends EventTarget {

  addEventListener<
    K extends Extract<keyof EventMap, string>,
    E extends EventMap[K]
  >(
    type: K,
    listener: (ev: E) => void,
    options?: boolean | AddEventListenerOptions
  ): void

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void

  addEventListener<
    K extends Extract<keyof EventMap, string>,
    E extends EventMap[K]
  >(
    type: K | string,
    listener: (evt: E) => void | EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }

}
