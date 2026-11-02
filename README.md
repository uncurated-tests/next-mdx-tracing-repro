# Missing runtime MDX file with Turbopack

This Next.js app reads a document and its shared partial from disk at runtime.
The shared partial is included in a standalone build with
`16.5.0-canary.29`, but is missing with `16.5.0-canary.30`.

The version boundary includes [Next.js PR #100651](https://github.com/vercel/next.js/pull/100651).
The app has no dependencies beyond Next.js, React, and React DOM.

## Reproduce

The package pins `16.5.0-canary.30`.

```sh
npm ci
npm run build
HOSTNAME=127.0.0.1 npm start
```

In another terminal:

```sh
curl http://localhost:3000/api/markdown/deploy
```

The shared partial is missing:

```json
{"partials":[{"error":"ENOENT"}]}
```

`npm start` runs the standalone build. This uses the files that Next.js copied
into `.next/standalone`, which exposes the missing runtime dependency.

## Compare with canary.29

Stop the server, then run:

```sh
npm install --save-exact next@16.5.0-canary.29
npm run build
HOSTNAME=127.0.0.1 npm start
```

The same request returns the shared partial:

```json
{"partials":["## Global Options\n\nThe shared CLI options.\n"]}
```

The build also warns that the file read in `lib/read-partials.js` causes the
whole project to be traced.

## Verify an explicit include

Stop the server, then run:

```sh
npm install --save-exact next@16.5.0-canary.30
INCLUDE_PARTIALS=1 npm run build
HOSTNAME=127.0.0.1 npm start
```

The request now returns the shared partial. The environment variable enables
this configuration:

```js
outputFileTracingIncludes: {
  '/api/markdown/*': ['./content/partials/**/*.mdx'],
},
```

## Relevant files

- `app/api/markdown/[slug]/route.js` reads `content/docs/deploy.mdx`.
- `lib/read-partials.js` resolves runtime imports, including nested imports.
- `content/docs/deploy.mdx` imports `@/content/partials/global-options.mdx`.
- `content/partials/global-options.mdx` contains the shared text.

The resolver derives the project root from the document path for `@/` imports.
Turbopack cannot statically resolve every alternative of that path. Canary.29
traces the whole project for the read, which includes the shared partial.
Canary.30 narrows the trace and omits the partial. An explicit include declares
the runtime dependency.
