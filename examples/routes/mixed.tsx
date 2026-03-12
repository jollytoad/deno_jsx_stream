import { renderHtmlResponse } from "@http/html-stream";
import { tokenize } from "@http/html-stream/transform/tokenize";
import { tagHooks } from "@http/html-stream/transform/tag-hooks";
import { prettify } from "@http/html-stream/hooks/prettify";
import { html } from "@http/html-stream/template";

export function GET(req: Request, match: URLPatternResult) {
  return renderHtmlResponse(page(req, match.pathname.input), {
    transformers: [
      tokenize(),
      tagHooks(...prettify()),
    ],
  });
}

function page(req: Request, path: string) {
  return html`
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/missing.css@1.2.0" />
      </head>
      <body>
        <header>
          <h1>Mixed JSX &amp; Tagged Template Streaming Example</h1>
          <p>You are here: ${path}</p>
        </header>
        <main>
          <h2>Headers</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${<Rows entries={req.headers.entries()} />}
            </tbody>
          </table>
        </main>
      </body>
    </html>
  `;
}

function* Rows({ entries }: { entries: Iterable<[string, string]> }) {
  for (const [name, value] of entries) {
    yield (
      <tr>
        <td>{name}</td>
        {html`
          <td>${value}</td>
        `}
      </tr>
    );
  }
}
