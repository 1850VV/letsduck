// Menus can replace their children while the opening click is still bubbling.
export function eventWithin(event: Pick<Event,'composedPath'>, container: EventTarget): boolean {
  return event.composedPath().includes(container);
}
