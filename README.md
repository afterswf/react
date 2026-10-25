AfterSWF for React
==================

A React component for [AfterSWF](https://github.com/afterswf/embed), [Mesmotronic](https://mesmotronic.com)'s
fork of AwayFL, which plays Flash content (AS1, AS2 and AS3) in the browser.

```sh
npm install @afterswf/react @afterswf/embed
```

## Usage

```tsx
import { useRef } from 'react';
import { AfterSWF, type AwayPlayerComponent } from '@afterswf/react';

export function Game() {
  const player = useRef<AwayPlayerComponent>(null);

  return (
    <AfterSWF
      ref={player}
      src="/swf/game.swf"
      width={550}
      height={400}
      flashvars={{ level: 1, name: 'Player 1' }}
      params={{ bgcolor: '#000000', scale: 'showAll' }}
      onLoad={() => console.log('Loaded')}
      onError={(message) => console.error(message)}
      externalFunctions={{ saveScore: (score: number) => console.log('Score', score) }}
    />
  );
}
```

The ref is the player's `<awayfl-player>` element, so functions the SWF adds with
`ExternalInterface.addCallback()` are its methods, e.g. `player.current?.pause()`.

### Without a build step

Using [jsDelivr](https://www.jsdelivr.com) and an import map:

```html
<script type="importmap">
  {
    "imports": {
      "react": "https://cdn.jsdelivr.net/npm/react@19.3.1/+esm",
      "react-dom/client": "https://cdn.jsdelivr.net/npm/react-dom@19.3.1/client/+esm",
      "@afterswf/react": "https://cdn.jsdelivr.net/npm/@afterswf/react@0.1.0/dist/index.js",
      "@afterswf/embed": "https://cdn.jsdelivr.net/npm/@afterswf/embed@0.1.4/dist/embed.mjs",
      "@afterswf/embed/version": "https://cdn.jsdelivr.net/npm/@afterswf/embed@0.1.4/dist/version.mjs"
    }
  }
</script>

<div id="root"></div>

<script type="module">
  import { createElement } from 'react';
  import { createRoot } from 'react-dom/client';
  import { AfterSWF } from '@afterswf/react';

  createRoot(document.getElementById('root')).render(
    createElement(AfterSWF, { src: 'game.swf', width: 550, height: 400, flashvars: { level: 1 } })
  );
</script>
```

Keep `react` and `react-dom` on the same exact version, as jsDelivr's `react-dom` imports that version of
`react`, so the page, `react-dom` and the component all share one copy of React.

## Props

| Prop | Description |
|---|---|
| `src` | URL of the SWF |
| `width`, `height` | Size in pixels, or a CSS length such as `"100%"` (default 550 × 400). Changing them resizes the player without reloading it |
| `flashvars` | FlashVars, as an object or a query string. AS3 gets them as `loaderInfo.parameters` and AS1/2 as `_root` variables |
| `params` | Flash parameters such as `bgcolor`, `scale` and `salign`, and [AfterSWF options](https://github.com/afterswf/embed/blob/main/src/embed/AwayPlayerComponent.ts) such as `smoothBitmaps` and `backgroundColor` |
| `runtimeBaseUrl` | Where `@afterswf/embed`'s `dist/` folder is served from (see below) |
| `onLoad` | Called when the SWF has loaded |
| `onProgress` | Called with loading progress, from 0 to 1 |
| `onError` | Called with a message if the SWF can't be loaded |
| `externalFunctions` | Functions the SWF can call with `ExternalInterface.call()`. As Flash looks them up in the page's global scope, they're defined as globals while the player is mounted |

Other props, such as `id`, `className` and `style`, are passed to the `<awayfl-player>` element.

Changing `src`, `flashvars`, `params` or `runtimeBaseUrl` reloads the SWF.

## Hosting the runtime

The player loads its runtime (`runtime.js`, about 2.6 MB) and assets by URL from `@afterswf/embed`'s `dist/`
folder, so they aren't part of your bundle. By default they come from jsDelivr, for the version of
`@afterswf/embed` you've installed.

To serve them yourself, copy `node_modules/@afterswf/embed/dist` into your public folder and set
`runtimeBaseUrl`, e.g. `runtimeBaseUrl="/afterswf/"`.

## Server rendering

`@afterswf/embed` is only loaded in the browser, after the component has mounted, so it's safe to render on a
server. The module starts with `'use client'` for the Next.js App Router.

## Developing

`@afterswf/embed` is linked from a sibling checkout (`../embed`) while it's developed alongside this:

```sh
npm install
npm run build    # or npm run watch
```
