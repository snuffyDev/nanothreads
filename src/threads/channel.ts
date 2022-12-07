import { browser } from './../internals';
import { BroadcastChannel as $NodeBroadcastChannel } from 'node:worker_threads';

export const BroadcastChannel = browser ? window.BroadcastChannel : $NodeBroadcastChannel
