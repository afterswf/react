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

Using [esm.sh](https://esm.sh):

```html
<div id="root"></div>

<script type="module">
  import { createElement } from 'https://esm.sh/react@19';
  import { createRoot } from 'https://esm.sh/react-dom@19/client';
  import { AfterSWF } from 'https://esm.sh/@afterswf/react?deps=react@19';

  createRoot(document.getElementById('root')).render(
    createElement(AfterSWF, { src: 'game.swf', width: 550, height: 400, flashvars: { level: 1 } })
  );
</script>
```

`?deps=react@19` makes the component use the same copy of React as the page.

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
