import { browser } from './../internals';
//@ts-expect-error
export const BroadcastChannel = browser ? window.BroadcastChannel : NodeBroadcastChannel;
