/**
 * `Node` is a container for the value of an item inside of a `Queue`
 */
export class Node<T> {
	value: T;
	next: Node<T> | null = null;
	constructor(value: T, next: Node<T> | null) {
		this.value = value;
		this.next = next;
	}
}

type QueueHeader<T> = {
	length: number;
	head: Node<T> | null;
	tail: Node<T> | null;
};

export class Queue<T> {
	private header: QueueHeader<T>;

	constructor() {
		this.header = { length: 0, head: null, tail: null };
	}

	public get length() {
		return this.header.length;
	}

	push(value: T) {
		const newNode = new Node(value, null);
		if (!this.header.tail) {
			this.header.head = newNode;
			this.header.tail = newNode;
		} else {
			this.header.tail.next = newNode;
			this.header.tail = newNode;
		}
		this.header.length++;
	}

	unshift(value: T) {
		const newNode = new Node(value, this.header.head);
		this.header.head = newNode;
		if (!this.header.tail) {
			this.header.tail = newNode;
		}
		this.header.length++;
	}

	pop() {
		const head = this.header.head;
		const tail = this.header.tail;
		if (!head || !tail) {
			return undefined;
		}

		if (head === tail) {
			this.header.head = null;
			this.header.tail = null;
			this.header.length--;
			return tail.value;
		}

		let current = head;
		while (current.next !== tail) {
			current = current.next!;
		}

		this.header.tail = current;
		this.header.tail.next = null;
		this.header.length--;
		return tail.value;
	}

	shift() {
		const head = this.header.head;
		if (!head) {
			return undefined;
		}

		this.header.head = head.next;
		if (!this.header.head) {
			this.header.tail = null;
		}
		this.header.length--;
		return head.value;
	}

	[Symbol.iterator] = () => {
		let currentNode = this.header.head;

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
	};
}
