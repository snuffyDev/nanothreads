export const browser = typeof window !== "undefined" && typeof window.document !== "undefined";

export const debounce = (func: (...args: any[]) => void, wait: number) => {
	let timeout: ReturnType<typeof setTimeout> | null;
	return (...args: any[]) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			func(...args);
		}, wait);
	};
};
