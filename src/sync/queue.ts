interface DoublyLinkedNode<T> {
	next: DoublyLinkedNode<T> | null;
	prev: DoublyLinkedNode<T> | null;
	value: T;
}

export class Queue<T> {
	private _head: DoublyLinkedNode<T> | null;
	private _length: number;
	private _tail: DoublyLinkedNode<T> | null;

	constructor() {
		this._head = null;
		this._tail = null;
		this._length = 0;
	}

	public get length() {
		return this._length;
	}

	[Symbol.iterator]() {
		let currentNode = this._head;

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

	public pop() {
		if (!this._tail) {
			return;
		}
		var value = this._tail.value;
		this._tail = this._tail.prev;
		if (!this._tail) {
			this._head = null;
		} else {
			this._tail.next = null;
		}
		this._length--;
		return value;
	}

	public push(value: T) {
		var newNode = { value, prev: this._tail, next: null };
		if (!this._head) {
			this._head = newNode;
		} else {
			this._tail!.next = newNode;
		}
		this._tail = newNode;
		this._length++;
	}

	public shift() {
		if (!this._head) {
			return;
		}
		var value = this._head.value;
		this._head = this._head.next;
		if (!this._head) {
			this._tail = null;
		} else {
			this._head.prev = null;
		}
		this._length--;
		return value;
	}

	public delete(item: T): boolean {
		if (!this._head) {
			return false;
		}
		if (this._head.value === item) {
			this._head = this._head.next;
			if (!this._head) {
				this._tail = null;
			} else {
				this._head.prev = null;
			}
			this._length--;
			return true;
		}
		let currentNode = this._head.next;
		while (currentNode) {
			if (currentNode.value === item) {
				currentNode.prev!.next = currentNode.next;
				if (currentNode.next) {
					currentNode.next.prev = currentNode.prev;
				} else {
					this._tail = currentNode.prev;
				}
				this._length--;
				return true;
			}
			currentNode = currentNode.next;
		}
		return false;
	}
	public unshift(value: T) {
		var newNode = { value, prev: null, next: this._head };
		if (!this._tail) {
			this._tail = newNode;
		} else {
			this._head!.prev = newNode;
		}
		this._head = newNode;
		this._length++;
	}
}
