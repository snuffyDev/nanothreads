type Maybe<T> = T | undefined;
class Node<T> {
	public next: Node<T> | null = null;
	public prev: Node<T> | null = null;
	constructor(public data: T) {}
}

interface ILinkedList<T> {
	head: Node<T>;
	tail: Node<T>;
	size: number;

	insertHead(data: T): Node<T>;
	insertTail(data: T): Node<T>;
	insertAt(data: T, index: number): Maybe<Node<T>>;
	removeHead(): T | null;
	removeTail(): T | null;
	removeAt(index: number): T | null;
	find({ value, index }: { value?: Maybe<T>; index?: Maybe<number> }): Maybe<{ node?: Node<T>; index?: number }>;
	toString(): string;
}

export class LinkedList<T = unknown> implements ILinkedList<T> {
	private _size: number = 0;
	private _head!: Node<T>;
	private _tail!: Node<T>;

	constructor(source?: T) {
		if (source) this.insertTail(source);
	}
	get head(): Node<T> {
		return this._head;
	}
	get tail(): Node<T> {
		return this._tail;
	}
	get size(): number {
		return this._size;
	}
	insertHead(data: T): Node<T> {
		const node = new Node(data);

		node.next = this.head;

		if (this.head) {
			this._head.prev = node;
		} else {
			this._tail = node;
		}
		this._head = node;
		this._size += 1;
		return node;
	}
	insertTail(data: T): Node<T> {
		const node = new Node(data);

		if (this.head) {
			node.prev = this.tail;
			this._tail.next = node;
			this._tail = node;
		} else {
			this._head = node;
			this._tail = node;
		}
		this._size += 1;
		return node;
	}
	insertAt(data: T, index: number = 0): Maybe<Node<T>> {
		if (index === 0) return this.insertHead(data);
		if (index === this.size) return this.insertTail(data);

		const itemAtIdx = this.find({ index })?.node;
		if (!itemAtIdx) return undefined;

		const itemToInsert = new Node(data);
		itemToInsert.prev = itemAtIdx.prev;
		itemToInsert.next = itemAtIdx;
		if (itemAtIdx.prev) itemAtIdx.prev.next = itemToInsert;
		itemAtIdx.prev = itemToInsert;

		this._size += 1;

		return itemToInsert;
	}
	removeHead(): T | null {
		if (!this.head) return null;
		const head = this.head;
		//@ts-expect-error it's fine
		this._head = head.next;

		if (this.head) {
			this._head.prev = null;
		} else {
			//@ts-expect-error it's fine

			this._tail = null;
		}
		this._size -= 1;
		return head.data;
	}
	removeTail(): T | null {
		if (!this._tail) return null;
		const tail = this._tail;

		//@ts-expect-error it's fine
		this._tail = tail.prev;

		if (this._tail) {
			this._tail.next = null;
		} else {
			//@ts-expect-error it's fine
			this._head = null;
		}
		this._size -= 1;
		return tail.data;
	}
	removeAt(index: number): T | null {
		if (index === 0) return this.removeHead();
		if (index === this.size - 1) return this.removeTail();

		const current = this.find({ index })?.node;

		if (!current) return null;

		//@ts-expect-error it's fine
		current.prev.next = current.next;
		//@ts-expect-error it's fine
		current.next.prev = current.prev;

		this._size -= 1;

		return current && current.data;
	}
	find({ value, index }: { value?: T; index?: number }): Maybe<{ node: Node<T>; index: number }> {
		for (
			let current = this.head, position = 0;
			//@ts-expect-error it's fine
			current && position <= index;
			//@ts-expect-error it's fine
			position += 1, current = current.next
		) {
			if (position === index || value === current.data) {
				return { node: current, index: position };
			}
		}
		return undefined;
	}

	*[Symbol.iterator]() {
		//@ts-expect-error it's fine
		for (let node = this.head; node; node = node.next) {
			yield node;
		}
	}
}
