import type { StatusCode } from "./statuses.js";

export interface ThreadError extends Error {
	status: StatusCode;
}
