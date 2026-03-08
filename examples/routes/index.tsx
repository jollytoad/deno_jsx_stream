import { renderHtmlResponse } from "@http/html-stream";
import { html } from "@http/html-stream/template";

export function GET() {
  return renderHtmlResponse(html`
    <html>
      <body>
        <h1>Streaming Template Examples</h1>
        <ul>
          <li><a href="jsx">JSX streaming</a></li>
          <li><a href="template">Tagged template literal streaming</a></li>
          <li><a href="mixed">Mix of JSX and tagged template streaming</a></li>
          <li><a href="deferred">Deferred JSX streaming</a></li>
          <li><a href="async">More deferred asynchronous streaming</a></li>
        </ul>
      </body>
    </html>
  `);
}
