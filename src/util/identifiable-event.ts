export class IdentifiableEvent<T extends Event> extends Event {
  constructor(public id: string, public event: T) {
    super(event.type);
  }
}
