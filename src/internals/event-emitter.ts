/**
 * `EventMap` is a utility type that defines the structure of the event map used by the `EventEmitter` class.
 *
 * @example
 * ```ts
 * type MyEvents = {
 *   'data': (payload: string) => void;
 *   'error': (error: Error) => void;
 * };
 *
 * const emitter = new EventEmitter<MyEvents>();
 * emitter.on('data', (payload) => console.log(payload));
 * emitter.emit('data', 'Hello, World!');
 * ```
 */
export type EventMap<Events extends { [K in keyof Events]: ((...args: any[]) => void)[] }> = {
	[Event in keyof Events]: Events[Event];
};

/**
 * A simple event emitter implementation used internally by the thread pool classes to manage events such as worker creation, termination, and errors.
 *
 * When creating your own custom thread pool implementation by extending `AbstractThreadPool`, you should use this `EventEmitter`
 * to have an event system that is compatible with the rest of the library and can be listened to by users of your custom pool.
 *
 * @example
 * @see {@link AbstractThreadPool} for an example of how to use `EventEmitter` in a custom thread pool implementation.
 */
export class EventEmitter<Events extends { [K in keyof Events]: ((...args: any[]) => void)[] }> {
	private readonly events: Map<keyof Events, Events[keyof Events]> = new Map();
	public on<Event extends keyof Events>(event: Event, listener: Events[Event][number]): void {
		if (!this.events.has(event)) {
			this.events.set(event, [] as unknown as Events[Event]);
		}
		this.events.get(event)!.push(listener);
	}
	public off<Event extends keyof Events>(event: Event, listener: Events[Event][number]): void {
		const listeners = this.events.get(event);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index !== -1) {
				listeners.splice(index, 1);
			}
		}
	}
	public emit<Event extends keyof Events>(event: Event, payload: Parameters<Events[Event][number]>[0]): void {
		const listeners = this.events.get(event);
		if (listeners) {
			for (const listener of listeners) {
				listener(payload);
			}
		}
	}
	public once<Event extends keyof Events>(event: Event, listener: Events[Event][number]): void {
		const onceListener: Events[Event][number] = (payload) => {
			this.off(event, onceListener as Events[Event][number]);
			listener(payload);
		};
		this.on(event, onceListener);
	}
}
export default EventEmitter;
