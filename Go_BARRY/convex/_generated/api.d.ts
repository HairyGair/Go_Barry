/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as analytics from "../analytics.js";
import type * as buses from "../buses.js";
import type * as communications from "../communications.js";
import type * as coordination from "../coordination.js";
import type * as crons from "../crons.js";
import type * as disruptions from "../disruptions.js";
import type * as dutyBoards from "../dutyBoards.js";
import type * as incidentsEnhanced from "../incidentsEnhanced.js";
import type * as storage from "../storage.js";
import type * as supervisors from "../supervisors.js";
import type * as sync from "../sync.js";
import type * as templates from "../templates.js";
import type * as vixData from "../vixData.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  analytics: typeof analytics;
  buses: typeof buses;
  communications: typeof communications;
  coordination: typeof coordination;
  crons: typeof crons;
  disruptions: typeof disruptions;
  dutyBoards: typeof dutyBoards;
  incidentsEnhanced: typeof incidentsEnhanced;
  storage: typeof storage;
  supervisors: typeof supervisors;
  sync: typeof sync;
  templates: typeof templates;
  vixData: typeof vixData;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
