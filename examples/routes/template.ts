import { renderHtmlResponse } from "@http/html-stream";
import { tagHooks } from "@http/html-stream/transform/tag-hooks";
import { prettify } from "@http/html-stream/hooks/prettify";
import { html } from "@http/html-stream/template";
import { delay } from "@std/async/delay";

export function GET(req: Request, match: URLPatternResult) {
  return renderHtmlResponse(page(req, match.pathname.input), {
    transformers: [tagHooks(...prettify())],
  });
}

function page(req: Request, path: string) {
  return html`
    <html>
      <body>
        <h1>JSX Streaming Example</h1>
        <p>You are here: ${path}</p>
        <h2>Headers</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${rows(req.headers.entries())}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

async function* rows(entries: Iterable<[string, string]>) {
  for (const [name, value] of entries) {
    await delay(50);
    yield html`
      <tr>
        <td>${name}</td>
        <td>${value}</td>
      </tr>
    `;
  }
}
