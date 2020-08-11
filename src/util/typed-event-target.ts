export interface AnyEventMap {
  [key: string]: Event;
}

export type Keys<T> = Extract<keyof T, string>;

export type SomeEventMap<T extends AnyEventMap> = {
  [key in Keys<T>]: T[key];
};

export class TypedEventTarget<T extends AnyEventMap, EventMap = SomeEventMap<T>>
  extends EventTarget
{
  addEventListener<
    K extends Keys<EventMap>,
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
    K extends Keys<EventMap>,
    E extends EventMap[K]
  >(
    type: K | string,
    listener: (ev: E) => void | EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(
      type,
      // @ts-expect-error 2352
      listener as EventListenerOrEventListenerObject,
      options
    );
  }

  removeEventListener<
    K extends Keys<EventMap>,
    E extends EventMap[K]
  >(
    type: K,
    listener: (ev: E) => void,
    options?: boolean | EventListenerOptions
  ): void

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void

  removeEventListener<
    K extends Keys<EventMap>,
    E extends EventMap[K]
  >(
    type: K | string,
    listener: (ev: E) => void | EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(
      type,
      // @ts-expect-error 2352
      listener as EventListenerOrEventListenerObject,
      options
    );
  };
}
