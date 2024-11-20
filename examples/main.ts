#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --watch

import { generateRoutes } from "./gen.ts";
import init from "@http/host-deno-local/init";
import { lazy } from "@http/route/lazy";

await generateRoutes();

const handler = lazy(import.meta.resolve("./routes.ts"));

await Deno.serve(await init(handler)).finished;
