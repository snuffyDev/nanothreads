interface Node<T> {
	value: T;
	next: Node<T> | null;
	prev: Node<T> | null;
}

class Node<T> {
	value: T;
	next: Node<T> | null = null;
	prev: Node<T> | null = null;
	constructor(value: T, next: Node<T> | null, prev: Node<T> | null) {
		this.value = value;
		this.next = next;
		this.prev = prev;
	}
}

export class Queue<T> {
	private head: Node<T> | null;
	private tail: Node<T> | null;
	private _length: number;

	constructor() {
		this.head = null;
		this.tail = null;
		this._length = 0;
	}
	public get length() {
		return this._length;
	}

	push(value: T) {
		var newNode = new Node(value, null, this.tail);
		if (!this.head) {
			this.head = newNode;
			this.tail = newNode;
			newNode.next = newNode;
			newNode.prev = newNode;
		} else {
			newNode.prev = this.tail!;
			newNode.next = this.head;
			this.tail!.next = newNode!;
			this.head.prev = newNode;
			this.tail = newNode;
		}
		this._length++;
	}

	unshift(value: T) {
		var newNode = new Node(value, this.head, null);

		if (!this.head) {
			this.head = newNode;
			this.tail = newNode;
			newNode.next = newNode;
			newNode.prev = newNode;
		} else {
			newNode.next = this.head;
			newNode.prev = this.tail!;
			this.head.prev = newNode;
			this.tail!.next = newNode;
			this.head = newNode;
		}
		this._length++;
	}

	pop() {
		const tail = this.tail;
		if (!this.head) {
			return;
		} else if (tail === this.tail) {
			this.head = null;
			this.tail = null;
		} else {
			this.tail = this.tail!.prev;
			this.tail!.next = this.head;
			this.head!.prev = this.tail;
		}
		this._length--;
		return tail!.value;
	}

	shift() {
		const head = this.head;
		if (!this.head) {
			return;
		} else if (this.head === this.tail) {
			this.head = null;
			this.tail = null;
		} else {
			this.head = this.head.next;
			this.head!.prev = this.tail!;
			this.tail!.next = this.head!;
		}
		this._length--;
		return head!.value;
	}

	[Symbol.iterator]() {
		let currentNode = this.head;

		return {
			next: () => {
				if (!currentNode) {
					return { done: true, value: undefined };
				}

				const value = currentNode.value;
				currentNode = currentNode.next;

				return { done: false, value };
			},
		};
	}
}
