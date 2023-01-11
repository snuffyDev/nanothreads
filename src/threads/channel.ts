import { browser } from './../internals';
//@ts-ignore
const _BroadcastChannel = browser ? window.BroadcastChannel : BroadcastChannel;

export { _BroadcastChannel as BroadcastChannel }
