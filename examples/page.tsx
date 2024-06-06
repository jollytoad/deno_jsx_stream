import { renderBody } from "@http/jsx-stream";
import { handle } from "@http/route/handle";
import { byPattern } from "@http/route/by-pattern";
import { html } from "@http/response/html";
import { prependDocType } from "@http/response/prepend-doctype";
import { port } from "@http/host-deno-local/port";

export default Deno.serve(
  { port: port() },
  handle([
    byPattern(["/", "/:path*"], (req, match) => {
      return html(
        prependDocType(
          renderBody(<Page req={req} path={match.pathname.groups.path!} />),
        ),
      );
    }),
  ]),
);

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
