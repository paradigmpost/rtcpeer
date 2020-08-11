interface AnyEventMap {
  [key: string]: Event;
}

type Keys<T> = Extract<keyof T, string>;

export type SomeEventMap<T extends AnyEventMap> = {
  [key in Keys<T>]: T[Keys<T>];
};

// WARNING: this does not enforce that values of the EventMap are Event's
// to workaround this temporarily, E is defined as 'EventMap[K] & Event'
export class TypedEventTarget<T extends AnyEventMap, EventMap = SomeEventMap<T>>
  extends EventTarget
{
  addEventListener<
    K extends Extract<keyof EventMap, string>,
    E extends EventMap[K]
  >(
    type: K,
    listener: (ev: E | Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }
}
