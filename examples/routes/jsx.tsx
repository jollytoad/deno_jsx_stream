import { renderHtmlResponse } from "@http/html-stream";
import { logTokens } from "@http/token-stream/transform/log-tokens";
import { tokenize } from "@http/html-stream/transform/tokenize";
import { tagHooks } from "@http/html-stream/transform/tag-hooks";
import { prettify } from "@http/html-stream/hooks/prettify";

export function GET(req: Request, match: URLPatternResult) {
  return renderHtmlResponse(
    <Page req={req} path={match.pathname.input} />,
    {
      transformers: [
        logTokens(),
        tokenize(),
        tagHooks(...prettify()),
      ],
    },
  );
}

function Page({ req, path }: { req: Request; path: string }) {
  const missing = Promise.resolve("https://unpkg.com/missing.css@1.2.0");
  return (
    <html>
      <head>
        <link rel="stylesheet" href={missing} />
      </head>
      <body>
        <header>
          <h1>JSX Streaming Example</h1>
          <p>You are here: {path}</p>
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
              <Rows entries={req.headers.entries()} />
            </tbody>
          </table>
        </main>
      </body>
    </html>
  );
}

function* Rows({ entries }: { entries: Iterable<[string, string]> }) {
  for (const [name, value] of entries) {
    yield (
      <tr>
        <td>{name}</td>
        <td>{value}</td>
      </tr>
    );
  }
}
