export type Releaser = () => void;
export type Resolver<T> = (value: number) => Promise<T> | T