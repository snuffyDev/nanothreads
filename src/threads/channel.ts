import { browser } from "./../internals/index.js";
//@ts-ignore
const _MessageChannel = browser ? globalThis.MessageChannel : MessageChannel;

export { _MessageChannel as MessageChannel };
