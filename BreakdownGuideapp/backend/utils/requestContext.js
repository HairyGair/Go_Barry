/**
 * Per-request context (AsyncLocalStorage), so deep services such as the activity
 * logger can see who the current request belongs to without every caller passing
 * req through. Used for demo isolation: activities logged during a demo session are
 * always tagged actor_id = DEMO01, whatever actorId the call site passed.
 *
 * Mount requestContextMiddleware once, after the body parsers and before any routes.
 * The store holds the live req, so req.user set later by auth middleware is visible.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage();

export function requestContextMiddleware(req, res, next) {
  requestContext.run({ req }, next);
}

/** The authenticated user of the current request, or null outside a request. */
export function currentRequestUser() {
  return requestContext.getStore()?.req?.user || null;
}

export default { requestContext, requestContextMiddleware, currentRequestUser };
