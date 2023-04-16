export const sleep = (ms = 500) => new Promise((resolve) => setTimeout(() => resolve(undefined), ms));
