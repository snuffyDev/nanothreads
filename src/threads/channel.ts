import { browser } from "./../internals";
//@ts-ignore
const _MessageChannel = browser ? globalThis.MessageChannel : MessageChannel;

export { _MessageChannel as MessageChannel };
