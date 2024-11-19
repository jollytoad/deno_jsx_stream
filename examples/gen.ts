#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env

import { generateRoutesModule } from "@http/generate/generate-routes-module";
import { dprintFormatModule } from "@http/generate/dprint-format-module";

export function generateRoutes() {
  console.debug("\nGenerating routes...");

  return generateRoutesModule({
    pattern: "/",
    fileRootUrl: import.meta.resolve("./routes"),
    moduleOutUrl: import.meta.resolve("./routes.ts"),
    formatModule: dprintFormatModule(),
    verbose: true,
  });
}

if (import.meta.main) {
  await generateRoutes();
}
