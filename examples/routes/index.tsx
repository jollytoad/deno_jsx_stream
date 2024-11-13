import { renderHtmlResponse } from "@http/html-stream";

export function GET(req: Request, match: URLPatternResult) {
  return renderHtmlResponse(
    <Page req={req} path={match.pathname.groups.path!} />,
  );
}

function Page({ req, path }: { req: Request; path: string }) {
  return (
    <html>
      <body>
        <h1>JSX Streaming Example</h1>
        <p>You are here: /{path}</p>
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
