/**
	Marks a transferable object as being able to be transferred between threads
	*/
export interface ITransferable {
	/** @internal */
	[transferable]: true;

	value: MarkedTransferable;
}
const transferable = Symbol("__transferable");

type MarkedTransferable = Transferable & { __transferable: true };

const transferableConstructors: (new (...args: any[]) => any)[] = [
	typeof ArrayBuffer !== "undefined" ? ArrayBuffer : undefined,
	typeof MessagePort !== "undefined" ? MessagePort : undefined,
	typeof ImageBitmap !== "undefined" ? ImageBitmap : undefined,
	typeof OffscreenCanvas !== "undefined" ? OffscreenCanvas : undefined,
	typeof TransformStream !== "undefined" ? TransformStream : undefined,
	typeof ReadableStream !== "undefined" ? ReadableStream : undefined,
	typeof WritableStream !== "undefined" ? WritableStream : undefined,
	typeof RTCDataChannel !== "undefined" ? RTCDataChannel : undefined,
	typeof VideoFrame !== "undefined" ? VideoFrame : undefined,
].filter(Boolean) as (new (...args: any[]) => any)[];
/**
 * @param value
 * @returns
 * @internal
 */
export const isMarkedTransferable = (value: unknown): value is ITransferable => {
	if (value && typeof value === "object" && transferable in value) return true;
	return false;
};

export const isTransferable = (value: unknown): value is Transferable => {
	if (value && typeof value === "object") {
		if (transferable in value) {
			return true;
		}
		for (const ctor of transferableConstructors) {
			if (value instanceof ctor) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Marks a value as being transferable
 *
 * This is used to mark a value as being able to be transferred between threads
 * Transferable objects are any of the following:
 * - ArrayBuffer
 * - MessagePort
 * - ImageBitmap
 * - OffscreenCanvas
 * - TransformStream
 * - ReadableStream
 * - WritableStream
 * - RTCDataChannel
 * - VideoFrame
 *
 * @param {unknown} value
 * @returns
 * @throws {Error} Value is not transferable
 * 
 * @example
 * const transferable = createTransferable(new ArrayBuffer(10));
 * 
 * // transferable is now marked as transferable
 * thread.send(transferable);
 * 
 */
export const createTransferable = (value: unknown): ITransferable => {
	if (isTransferable(value)) {
		// @ts-ignore - this is a hack to make sure the value is marked as transferable in the other thread
		value[transferable] = true;
		return { value: value as MarkedTransferable, [transferable]: true };
	}
	throw new Error("Value is not transferable");
};
