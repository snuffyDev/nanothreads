export const yieldMicrotask = () =>
	new Promise<void>((resolve) => {
		queueMicrotask(resolve);
	});
