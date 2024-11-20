import { renderHtmlResponse } from "@http/html-stream";
import { htmlDeferralHandler } from "@http/html-stream/html-deferral-handler";
import { delay } from "@std/async/delay";

export function GET(req: Request, match: URLPatternResult) {
  let id = 0;

  return renderHtmlResponse(<Page req={req} path={match.pathname.input} />, {
    deferralHandler: htmlDeferralHandler({
      timeout: 10,
      generateId: () => `x-${++id}`,
    }),
  });
}

function Page({ req, path }: { req: Request; path: string }) {
  return (
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/missing.css@1.1.3" />
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
        <footer>
          This is an example of deferral of content.
        </footer>
      </body>
    </html>
  );
}

async function* Rows({ entries }: { entries: Iterable<[string, string]> }) {
  for (const [name, value] of entries) {
    await delay(100);
    yield (
      <tr>
        <td>{name}</td>
        <td>{value}</td>
      </tr>
    );
  }
}
