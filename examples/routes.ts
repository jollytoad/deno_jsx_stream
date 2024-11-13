// IMPORTANT: This file has been automatically generated, DO NOT edit by hand.

import { byMethod } from "@http/route/by-method";
import { byPattern } from "@http/route/by-pattern";
import { cascade } from "@http/route/cascade";
import { lazy } from "@http/route/lazy";

export default cascade(
  byPattern(
    "/deferred",
    lazy(async () => byMethod(await import("./routes/deferred.tsx"))),
  ),
  byPattern(
    "/",
    lazy(async () => byMethod(await import("./routes/index.tsx"))),
  ),
);
