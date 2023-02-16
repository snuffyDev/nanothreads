class Node<T> {
	value: T;
	next: Node<T> | null;
	prev: Node<T> | null;

	constructor(value: T) {
		this.value = value;
		this.next = null;
		this.prev = null;
	}
}

export class CircularDoublyLinkedList<T> {
	private head: Node<T> | null;
	private tail: Node<T> | null;
	private length: number;

	constructor() {
		this.head = null;
		this.tail = null;
		this.length = 0;
	}

	push(value: T) {
		const newNode = new Node(value)!;
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
		this.length++;
	}

	unshift(value: T) {
		const newNode = new Node(value);
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
		this.length++;
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
		this.length--;
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
		this.length--;
		return head!.value;
	}
}
