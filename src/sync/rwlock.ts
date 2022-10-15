// import { ISemaphoreQueueEntry, Callback, Releaser } from "models";
// import { Semaphore } from "./semaphore";

// export class RWLock {
//     #maxReaders = 4;
//     #maxWriters = 1;

//     #readQueue: ISemaphoreQueueEntry[][];
//     #writeWaiting: (() => void)[][];

//     #readValue: number;
//     #writeValue: number;

//     #isWriting = false;
//     public get readers() {
//         return
//     }
//     constructor(maxReaders = 4, maxWriters = 1) {
//         this.#maxReaders = maxReaders;
//         this.#maxWriters = maxWriters;

//         this.#readValue = this.#maxReaders;
//         this.#writeValue = this.#maxWriters;

//     }

//     isLocked(): boolean {
//         throw new Error("Method not implemented.");
//     }
//     dispatch<T>(callback: Callback<T>): Promise<T> {
//         throw new Error("Method not implemented.");
//     }

//     acquire(value?: number = 1): Promise<[number, Releaser]> {
//         throw new Error("Method not implemented.");
//     }

//     waitForUnlock(value?: number | undefined): Promise<void> {
//         throw new Error("Method not implemented.");
//     }

//     release(value?: number | undefined): void {
//         throw new Error("Method not implemented.");
//     }

// }
