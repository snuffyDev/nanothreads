import { StatusCode } from "./statuses";

export interface ThreadError extends Error {
    status: StatusCode
}