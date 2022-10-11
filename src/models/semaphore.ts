import { Releaser } from "./promises";

export type Callback<T> = () => Promise<T> | T

export interface ISemaphoreQueueEntry {
    resolve(result: [number, Releaser]): void;
    reject(err: unknown): void;
}

export interface ISemaphore {

    isLocked(): boolean;
    acquire(value: number): Promise<[number, Releaser]>;

    waitForUnlock(value?: number): Promise<void>;

    setValue(value: number): void;
    release(value?: number) : void;
    getValue(): number;

    cancel(): void;
}

