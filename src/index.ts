'use client';

import { createElement, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { CSSProperties, ForwardedRef, HTMLAttributes, ReactElement } from 'react';
import type { AwayPlayerComponent } from '@afterswf/embed';
import { VERSION } from '@afterswf/embed/version';

export type { AwayPlayerComponent } from '@afterswf/embed';

export type FlashValue = string | number | boolean;

export interface AfterSWFProps extends Omit<HTMLAttributes<HTMLElement>, 'onLoad' | 'onError' | 'onProgress' | 'children'> {
	/** URL of the SWF */
	src: string;
	/** Width in pixels, or a CSS length such as "100%" (default 550) */
	width?: number | string;
	/** Height in pixels, or a CSS length such as "100%" (default 400) */
	height?: number | string;
	/** FlashVars, as an object or a query string (a=1&b=2) */
	flashvars?: Record<string, FlashValue> | string;
	/**
	 * Flash parameters such as bgcolor, scale and salign, and AfterSWF options
	 * such as smoothBitmaps and backgroundColor
	 */
	params?: Record<string, FlashValue>;
	/**
	 * Where @afterswf/embed's dist folder (loader.js, runtime.js and assets) is
	 * served from. Defaults to jsDelivr, for the installed version of @afterswf/embed.
	 */
	runtimeBaseUrl?: string;
	/** Called when the SWF has loaded */
	onLoad?: () => void;
	/** Called with loading progress, from 0 to 1 */
	onProgress?: (progress: number) => void;
	/** Called if the SWF can't be loaded */
	onError?: (message: string) => void;
	/**
	 * Functions the SWF can call with ExternalInterface.call(), which looks them
	 * up in the page's global scope, so they're defined as globals while it's mounted
	 */
	externalFunctions?: Record<string, (...args: any[]) => any>;
}

export const DEFAULT_RUNTIME_BASE_URL = `https://cdn.jsdelivr.net/npm/@afterswf/embed@${VERSION}/dist/`;

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

let embed: Promise<unknown>;

/**
 * Loads @afterswf/embed, which defines <awayfl-player>, in the browser only, as it
 * uses window and document as soon as it's imported
 */
function loadEmbed(): Promise<unknown> {
	return embed || (embed = import('@afterswf/embed'));
}

function cssSize(value: number | string): string {
	return typeof value === 'number' ? value + 'px' : value;
}

function toQueryString(flashvars: Record<string, FlashValue> | string): string {
	if (typeof flashvars === 'string') {
		return flashvars;
	}

	const query = new URLSearchParams();
	for (const name in flashvars) {
		query.append(name, String(flashvars[name]));
	}
	return query.toString();
}

/**
 * Plays a SWF with AfterSWF. The ref is the <awayfl-player> element, so functions
 * the SWF adds with ExternalInterface.addCallback() are methods of ref.current.
 */
export const AfterSWF = forwardRef(function AfterSWF(
	props: AfterSWFProps,
	ref: ForwardedRef<AwayPlayerComponent | null>
): ReactElement {
	const {
		src, width = 550, height = 400, flashvars, params, runtimeBaseUrl,
		onLoad, onProgress, onError, externalFunctions, style, ...attributes
	} = props;

	const element = useRef<AwayPlayerComponent | null>(null);

	// the latest props, without resubscribing whenever they change
	const latest = useRef({onLoad, onProgress, onError, externalFunctions});
	latest.current = {onLoad, onProgress, onError, externalFunctions};

	// the player reads these once, as <param>s, so it's remounted when they change
	const config: Record<string, string> = {
		movie: src,
		runtimeBaseUrl: runtimeBaseUrl || DEFAULT_RUNTIME_BASE_URL,
	};
	for (const name in params) {
		config[name] = String(params[name]);
	}
	if (flashvars !== undefined) {
		config.flashvars = toQueryString(flashvars);
	}
	const key = JSON.stringify(config);

	// but its size is applied by its style, without reloading it
	config.width = String(width);
	config.height = String(height);

	useImperativeHandle(ref, () => element.current as AwayPlayerComponent, [key]);

	useEffect(() => {
		loadEmbed().catch((e) => latest.current.onError?.(String(e && e.message || e)));
	}, []);

	useIsomorphicLayoutEffect(() => {
		const player = element.current;
		if (!player) {
			return;
		}

		const load = () => latest.current.onLoad?.();
		const progress = (event: Event) => latest.current.onProgress?.((event as CustomEvent).detail);
		const error = (event: Event) => latest.current.onError?.((event as ErrorEvent).message);

		player.addEventListener('load', load);
		player.addEventListener('progress', progress);
		player.addEventListener('error', error);

		return () => {
			player.removeEventListener('load', load);
			player.removeEventListener('progress', progress);
			player.removeEventListener('error', error);
		};
	}, [key]);

	const functionNames = Object.keys(externalFunctions || {}).sort().join(',');

	useEffect(() => {
		if (!functionNames) {
			return;
		}

		const global = window as any;
		const names = functionNames.split(',');
		const previous = names.map((name) => Object.getOwnPropertyDescriptor(global, name));

		names.forEach((name) => {
			global[name] = (...args: any[]) => latest.current.externalFunctions?.[name]?.(...args);
		});

		return () => names.forEach((name, i) => {
			if (previous[i]) {
				Object.defineProperty(global, name, previous[i]!);
			} else {
				delete global[name];
			}
		});
	}, [functionNames]);

	const sizedStyle: CSSProperties = {width: cssSize(width), height: cssSize(height), ...style};

	return createElement(
		'awayfl-player',
		{...attributes, key, ref: element, style: sizedStyle},
		Object.keys(config).map((name) => createElement('param', {key: name, name, value: config[name]}))
	);
});
