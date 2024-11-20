import { delay } from "@std/async/delay";
import type { Children } from "@http/jsx-stream/types";
import { isAsyncIterable, isIterable } from "@http/token-stream/guards";
import { renderHtmlResponse } from "@http/html-stream";
import { htmlDeferralHandler } from "@http/html-stream/html-deferral-handler";

export function GET() {
  return renderHtmlResponse(<Page />, {
    deferralHandler: htmlDeferralHandler(),
  });
}

function Page() {
  return (
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/missing.css@1.1.3" />
        <style>
          {/*css*/ `
          .red {
            color: red
          }
        `}
        </style>
      </head>
      <body>
        <header>
          <h1>JSX Async Components Example</h1>
          <p>This is a demo of streaming of asynchronous components.</p>
        </header>
        <main>
          <p>
            The following component returns an AsyncIterable of it's children,
            adding a 1 second delay before each child.
          </p>

          <ol>
            <Trickled delay={1000}>
              <li>one</li>
              <li>two</li>
              <li>three</li>
              <li>four</li>
            </Trickled>
          </ol>

          <Delayed delay={2000}>
            <div class="red">
              This component returns a Promise that delays for 2 seconds
            </div>
          </Delayed>

          <hr />

          <Delayed delay={3000}>
            <div class="red">
              This component returns a Promise that delays for 3 seconds
            </div>
          </Delayed>

          <hr />

          <Delayed delay={1000}>
            <div class="red">
              This component returns a Promise that delays for 1 second
            </div>
          </Delayed>
        </main>
        <footer>
          This footer should be visible whilst the content above is deferred.
        </footer>
      </body>
    </html>
  );
}

async function Delayed(props: { delay: number; children: Children }) {
  await delay(props.delay);

  return <>{props.children}</>;
}

async function* Trickled(props: { delay: number; children: Children }) {
  if (
    isIterable<unknown>(props.children) ||
    isAsyncIterable<unknown>(props.children)
  ) {
    for await (const child of props.children) {
      await delay(props.delay);
      yield child;
    }
  }
}
