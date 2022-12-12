import { browser } from './../internals';
export const BroadcastChannel = browser ? window.BroadcastChannel : require("worker_threads").BroadcastChannel;
