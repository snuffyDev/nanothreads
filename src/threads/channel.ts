import { browser } from "./../internals";
//@ts-ignore
const _MessageChannel = browser ? window.MessageChannel : MessageChannel;

export { _MessageChannel as MessageChannel };
