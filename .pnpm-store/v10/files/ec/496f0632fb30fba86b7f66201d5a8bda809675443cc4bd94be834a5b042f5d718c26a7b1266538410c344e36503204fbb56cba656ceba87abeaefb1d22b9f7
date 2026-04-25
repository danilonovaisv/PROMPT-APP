import { transformAsync } from "@babel/core";
import componentNameAnnotatePlugin, { experimentalComponentNameAnnotatePlugin } from "@sentry/babel-plugin-component-annotate";
import SentryCli from "@sentry/cli";
import * as fs$1 from "fs";
import fs from "fs";
import findUp from "find-up";
import * as path$1 from "path";
import path from "path";
import * as os$1 from "os";
import os from "os";
import crypto from "crypto";
import childProcess from "child_process";
import MagicString from "magic-string";
import { glob } from "glob";
import * as dotenv from "dotenv";
import * as https from "node:https";
import { Readable } from "node:stream";
import { createGzip } from "node:zlib";
import * as url from "url";
import * as util from "util";
import { promisify } from "util";
//#region node_modules/@sentry/utils/build/esm/is.js
const objectToString = Object.prototype.toString;
/**
* Checks whether given value's type is one of a few Error or Error-like
* {@link isError}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isError(wat) {
	switch (objectToString.call(wat)) {
		case "[object Error]":
		case "[object Exception]":
		case "[object DOMException]": return true;
		default: return isInstanceOf(wat, Error);
	}
}
/**
* Checks whether given value is an instance of the given built-in class.
*
* @param wat The value to be checked
* @param className
* @returns A boolean representing the result.
*/
function isBuiltin(wat, className) {
	return objectToString.call(wat) === `[object ${className}]`;
}
/**
* Checks whether given value's type is ErrorEvent
* {@link isErrorEvent}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isErrorEvent$1(wat) {
	return isBuiltin(wat, "ErrorEvent");
}
/**
* Checks whether given value's type is a string
* {@link isString}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isString(wat) {
	return isBuiltin(wat, "String");
}
/**
* Checks whether given string is parameterized
* {@link isParameterizedString}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isParameterizedString(wat) {
	return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
}
/**
* Checks whether given value is a primitive (undefined, null, number, boolean, string, bigint, symbol)
* {@link isPrimitive}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isPrimitive(wat) {
	return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
}
/**
* Checks whether given value's type is an object literal, or a class instance.
* {@link isPlainObject}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isPlainObject(wat) {
	return isBuiltin(wat, "Object");
}
/**
* Checks whether given value's type is an Event instance
* {@link isEvent}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isEvent(wat) {
	return typeof Event !== "undefined" && isInstanceOf(wat, Event);
}
/**
* Checks whether given value's type is an Element instance
* {@link isElement}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isElement(wat) {
	return typeof Element !== "undefined" && isInstanceOf(wat, Element);
}
/**
* Checks whether given value has a then function.
* @param wat A value to be checked.
*/
function isThenable(wat) {
	return Boolean(wat && wat.then && typeof wat.then === "function");
}
/**
* Checks whether given value's type is a SyntheticEvent
* {@link isSyntheticEvent}.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isSyntheticEvent(wat) {
	return isPlainObject(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
}
/**
* Checks whether given value's type is an instance of provided constructor.
* {@link isInstanceOf}.
*
* @param wat A value to be checked.
* @param base A constructor to be used in a check.
* @returns A boolean representing the result.
*/
function isInstanceOf(wat, base) {
	try {
		return wat instanceof base;
	} catch (_e) {
		return false;
	}
}
/**
* Checks whether given value's type is a Vue ViewModel.
*
* @param wat A value to be checked.
* @returns A boolean representing the result.
*/
function isVueViewModel(wat) {
	return !!(typeof wat === "object" && wat !== null && (wat.__isVue || wat._isVue));
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/string.js
/**
* Truncates given string to the maximum characters count
*
* @param str An object that contains serializable values
* @param max Maximum number of characters in truncated string (0 = unlimited)
* @returns string Encoded
*/
function truncate(str, max = 0) {
	if (typeof str !== "string" || max === 0) return str;
	return str.length <= max ? str : `${str.slice(0, max)}...`;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/version.js
const SDK_VERSION = "8.30.0";
//#endregion
//#region node_modules/@sentry/utils/build/esm/worldwide.js
/** Get's the global object for the current JavaScript runtime */
const GLOBAL_OBJ = globalThis;
/**
* Returns a global singleton contained in the global `__SENTRY__[]` object.
*
* If the singleton doesn't already exist in `__SENTRY__`, it will be created using the given factory
* function and added to the `__SENTRY__` object.
*
* @param name name of the global singleton on __SENTRY__
* @param creator creator Factory function to create the singleton if it doesn't already exist on `__SENTRY__`
* @param obj (Optional) The global object on which to look for `__SENTRY__`, if not `GLOBAL_OBJ`'s return value
* @returns the singleton
*/
function getGlobalSingleton(name, creator, obj) {
	const gbl = obj || GLOBAL_OBJ;
	const __SENTRY__ = gbl.__SENTRY__ = gbl.__SENTRY__ || {};
	const versionedCarrier = __SENTRY__[SDK_VERSION] = __SENTRY__["8.30.0"] || {};
	return versionedCarrier[name] || (versionedCarrier[name] = creator());
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/browser.js
const WINDOW = GLOBAL_OBJ;
const DEFAULT_MAX_STRING_LENGTH = 80;
/**
* Given a child DOM element, returns a query-selector statement describing that
* and its ancestors
* e.g. [HTMLElement] => body > div > input#foo.btn[name=baz]
* @returns generated DOM path
*/
function htmlTreeAsString(elem, options = {}) {
	if (!elem) return "<unknown>";
	try {
		let currentElem = elem;
		const MAX_TRAVERSE_HEIGHT = 5;
		const out = [];
		let height = 0;
		let len = 0;
		const separator = " > ";
		const sepLength = 3;
		let nextStr;
		const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
		const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
		while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
			nextStr = _htmlElementAsString(currentElem, keyAttrs);
			if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) break;
			out.push(nextStr);
			len += nextStr.length;
			currentElem = currentElem.parentNode;
		}
		return out.reverse().join(separator);
	} catch (_oO) {
		return "<unknown>";
	}
}
/**
* Returns a simple, query-selector representation of a DOM element
* e.g. [HTMLElement] => input#foo.btn[name=baz]
* @returns generated DOM path
*/
function _htmlElementAsString(el, keyAttrs) {
	const elem = el;
	const out = [];
	if (!elem || !elem.tagName) return "";
	if (WINDOW.HTMLElement) {
		if (elem instanceof HTMLElement && elem.dataset) {
			if (elem.dataset["sentryComponent"]) return elem.dataset["sentryComponent"];
			if (elem.dataset["sentryElement"]) return elem.dataset["sentryElement"];
		}
	}
	out.push(elem.tagName.toLowerCase());
	const keyAttrPairs = keyAttrs && keyAttrs.length ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
	if (keyAttrPairs && keyAttrPairs.length) keyAttrPairs.forEach((keyAttrPair) => {
		out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
	});
	else {
		if (elem.id) out.push(`#${elem.id}`);
		const className = elem.className;
		if (className && isString(className)) {
			const classes = className.split(/\s+/);
			for (const c of classes) out.push(`.${c}`);
		}
	}
	for (const k of [
		"aria-label",
		"type",
		"name",
		"title",
		"alt"
	]) {
		const attr = elem.getAttribute(k);
		if (attr) out.push(`[${k}="${attr}"]`);
	}
	return out.join("");
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/debug-build.js
/**
* This serves as a build time flag that will be true by default, but false in non-debug builds or if users replace `__SENTRY_DEBUG__` in their generated code.
*
* ATTENTION: This constant must never cross package boundaries (i.e. be exported) to guarantee that it can be used for tree shaking.
*/
const DEBUG_BUILD$1 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
//#endregion
//#region node_modules/@sentry/utils/build/esm/logger.js
/** Prefix for logging strings */
const PREFIX = "Sentry Logger ";
const CONSOLE_LEVELS = [
	"debug",
	"info",
	"warn",
	"error",
	"log",
	"assert",
	"trace"
];
/** This may be mutated by the console instrumentation. */
const originalConsoleMethods = {};
/** JSDoc */
/**
* Temporarily disable sentry console instrumentations.
*
* @param callback The function to run against the original `console` messages
* @returns The results of the callback
*/
function consoleSandbox(callback) {
	if (!("console" in GLOBAL_OBJ)) return callback();
	const console = GLOBAL_OBJ.console;
	const wrappedFuncs = {};
	const wrappedLevels = Object.keys(originalConsoleMethods);
	wrappedLevels.forEach((level) => {
		const originalConsoleMethod = originalConsoleMethods[level];
		wrappedFuncs[level] = console[level];
		console[level] = originalConsoleMethod;
	});
	try {
		return callback();
	} finally {
		wrappedLevels.forEach((level) => {
			console[level] = wrappedFuncs[level];
		});
	}
}
function makeLogger() {
	let enabled = false;
	const logger = {
		enable: () => {
			enabled = true;
		},
		disable: () => {
			enabled = false;
		},
		isEnabled: () => enabled
	};
	if (DEBUG_BUILD$1) CONSOLE_LEVELS.forEach((name) => {
		logger[name] = (...args) => {
			if (enabled) consoleSandbox(() => {
				GLOBAL_OBJ.console[name](`${PREFIX}[${name}]:`, ...args);
			});
		};
	});
	else CONSOLE_LEVELS.forEach((name) => {
		logger[name] = () => void 0;
	});
	return logger;
}
/**
* This is a logger singleton which either logs things or no-ops if logging is not enabled.
* The logger is a singleton on the carrier, to ensure that a consistent logger is used throughout the SDK.
*/
const logger = getGlobalSingleton("logger", makeLogger);
//#endregion
//#region node_modules/@sentry/utils/build/esm/dsn.js
/** Regular expression used to parse a Dsn. */
const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
function isValidProtocol(protocol) {
	return protocol === "http" || protocol === "https";
}
/**
* Renders the string representation of this Dsn.
*
* By default, this will render the public representation without the password
* component. To get the deprecated private representation, set `withPassword`
* to true.
*
* @param withPassword When set to true, the password will be included.
*/
function dsnToString(dsn, withPassword = false) {
	const { host, path, pass, port, projectId, protocol, publicKey } = dsn;
	return `${protocol}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path ? `${path}/` : path}${projectId}`;
}
/**
* Parses a Dsn from a given string.
*
* @param str A Dsn as string
* @returns Dsn as DsnComponents or undefined if @param str is not a valid DSN string
*/
function dsnFromString(str) {
	const match = DSN_REGEX.exec(str);
	if (!match) {
		consoleSandbox(() => {
			console.error(`Invalid Sentry Dsn: ${str}`);
		});
		return;
	}
	const [protocol, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
	let path = "";
	let projectId = lastPath;
	const split = projectId.split("/");
	if (split.length > 1) {
		path = split.slice(0, -1).join("/");
		projectId = split.pop();
	}
	if (projectId) {
		const projectMatch = projectId.match(/^\d+/);
		if (projectMatch) projectId = projectMatch[0];
	}
	return dsnFromComponents({
		host,
		pass,
		path,
		projectId,
		port,
		protocol,
		publicKey
	});
}
function dsnFromComponents(components) {
	return {
		protocol: components.protocol,
		publicKey: components.publicKey || "",
		pass: components.pass || "",
		host: components.host,
		port: components.port || "",
		path: components.path || "",
		projectId: components.projectId
	};
}
function validateDsn(dsn) {
	if (!DEBUG_BUILD$1) return true;
	const { port, projectId, protocol } = dsn;
	if ([
		"protocol",
		"publicKey",
		"host",
		"projectId"
	].find((component) => {
		if (!dsn[component]) {
			logger.error(`Invalid Sentry Dsn: ${component} missing`);
			return true;
		}
		return false;
	})) return false;
	if (!projectId.match(/^\d+$/)) {
		logger.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
		return false;
	}
	if (!isValidProtocol(protocol)) {
		logger.error(`Invalid Sentry Dsn: Invalid protocol ${protocol}`);
		return false;
	}
	if (port && isNaN(parseInt(port, 10))) {
		logger.error(`Invalid Sentry Dsn: Invalid port ${port}`);
		return false;
	}
	return true;
}
/**
* Creates a valid Sentry Dsn object, identifying a Sentry instance and project.
* @returns a valid DsnComponents object or `undefined` if @param from is an invalid DSN source
*/
function makeDsn(from) {
	const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
	if (!components || !validateDsn(components)) return;
	return components;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/error.js
/** An error emitted by Sentry SDKs and related utilities. */
var SentryError = class extends Error {
	/** Display name of this error instance. */
	constructor(message, logLevel = "warn") {
		super(message);
		this.message = message;
		this.name = new.target.prototype.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
		this.logLevel = logLevel;
	}
};
//#endregion
//#region node_modules/@sentry/utils/build/esm/object.js
/**
* Defines a non-enumerable property on the given object.
*
* @param obj The object on which to set the property
* @param name The name of the property to be set
* @param value The value to which to set the property
*/
function addNonEnumerableProperty(obj, name, value) {
	try {
		Object.defineProperty(obj, name, {
			value,
			writable: true,
			configurable: true
		});
	} catch (o_O) {
		DEBUG_BUILD$1 && logger.log(`Failed to add non-enumerable property "${name}" to object`, obj);
	}
}
/**
* Encodes given object into url-friendly format
*
* @param object An object that contains serializable values
* @returns string Encoded
*/
function urlEncode(object) {
	return Object.keys(object).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(object[key])}`).join("&");
}
/**
* Transforms any `Error` or `Event` into a plain object with all of their enumerable properties, and some of their
* non-enumerable properties attached.
*
* @param value Initial source that we have to transform in order for it to be usable by the serializer
* @returns An Event or Error turned into an object - or the value argurment itself, when value is neither an Event nor
*  an Error.
*/
function convertToPlainObject(value) {
	if (isError(value)) return {
		message: value.message,
		name: value.name,
		stack: value.stack,
		...getOwnProperties(value)
	};
	else if (isEvent(value)) {
		const newObj = {
			type: value.type,
			target: serializeEventTarget(value.target),
			currentTarget: serializeEventTarget(value.currentTarget),
			...getOwnProperties(value)
		};
		if (typeof CustomEvent !== "undefined" && isInstanceOf(value, CustomEvent)) newObj.detail = value.detail;
		return newObj;
	} else return value;
}
/** Creates a string representation of the target of an `Event` object */
function serializeEventTarget(target) {
	try {
		return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
	} catch (_oO) {
		return "<unknown>";
	}
}
/** Filters out all but an object's own properties */
function getOwnProperties(obj) {
	if (typeof obj === "object" && obj !== null) {
		const extractedProps = {};
		for (const property in obj) if (Object.prototype.hasOwnProperty.call(obj, property)) extractedProps[property] = obj[property];
		return extractedProps;
	} else return {};
}
/**
* Given any captured exception, extract its keys and create a sorted
* and truncated list that will be used inside the event message.
* eg. `Non-error exception captured with keys: foo, bar, baz`
*/
function extractExceptionKeysForMessage(exception, maxLength = 40) {
	const keys = Object.keys(convertToPlainObject(exception));
	keys.sort();
	const firstKey = keys[0];
	if (!firstKey) return "[object has no keys]";
	if (firstKey.length >= maxLength) return truncate(firstKey, maxLength);
	for (let includedKeys = keys.length; includedKeys > 0; includedKeys--) {
		const serialized = keys.slice(0, includedKeys).join(", ");
		if (serialized.length > maxLength) continue;
		if (includedKeys === keys.length) return serialized;
		return truncate(serialized, maxLength);
	}
	return "";
}
/**
* Given any object, return a new object having removed all fields whose value was `undefined`.
* Works recursively on objects and arrays.
*
* Attention: This function keeps circular references in the returned object.
*/
function dropUndefinedKeys(inputValue) {
	return _dropUndefinedKeys(inputValue, /* @__PURE__ */ new Map());
}
function _dropUndefinedKeys(inputValue, memoizationMap) {
	if (isPojo(inputValue)) {
		const memoVal = memoizationMap.get(inputValue);
		if (memoVal !== void 0) return memoVal;
		const returnValue = {};
		memoizationMap.set(inputValue, returnValue);
		for (const key of Object.keys(inputValue)) if (typeof inputValue[key] !== "undefined") returnValue[key] = _dropUndefinedKeys(inputValue[key], memoizationMap);
		return returnValue;
	}
	if (Array.isArray(inputValue)) {
		const memoVal = memoizationMap.get(inputValue);
		if (memoVal !== void 0) return memoVal;
		const returnValue = [];
		memoizationMap.set(inputValue, returnValue);
		inputValue.forEach((item) => {
			returnValue.push(_dropUndefinedKeys(item, memoizationMap));
		});
		return returnValue;
	}
	return inputValue;
}
function isPojo(input) {
	if (!isPlainObject(input)) return false;
	try {
		const name = Object.getPrototypeOf(input).constructor.name;
		return !name || name === "Object";
	} catch (e) {
		return true;
	}
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/stacktrace.js
const STACKTRACE_FRAME_LIMIT = 50;
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
/**
* Creates a stack parser with the supplied line parsers
*
* StackFrames are returned in the correct order for Sentry Exception
* frames and with Sentry SDK internal frames removed from the top and bottom
*
*/
function createStackParser(...parsers) {
	const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
	return (stack, skipFirstLines = 0, framesToPop = 0) => {
		const frames = [];
		const lines = stack.split("\n");
		for (let i = skipFirstLines; i < lines.length; i++) {
			const line = lines[i];
			if (line.length > 1024) continue;
			const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
			if (cleanedLine.match(/\S*Error: /)) continue;
			for (const parser of sortedParsers) {
				const frame = parser(cleanedLine);
				if (frame) {
					frames.push(frame);
					break;
				}
			}
			if (frames.length >= STACKTRACE_FRAME_LIMIT + framesToPop) break;
		}
		return stripSentryFramesAndReverse(frames.slice(framesToPop));
	};
}
/**
* Removes Sentry frames from the top and bottom of the stack if present and enforces a limit of max number of frames.
* Assumes stack input is ordered from top to bottom and returns the reverse representation so call site of the
* function that caused the crash is the last frame in the array.
* @hidden
*/
function stripSentryFramesAndReverse(stack) {
	if (!stack.length) return [];
	const localStack = Array.from(stack);
	if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) localStack.pop();
	localStack.reverse();
	if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
		localStack.pop();
		if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) localStack.pop();
	}
	return localStack.slice(0, STACKTRACE_FRAME_LIMIT).map((frame) => ({
		...frame,
		filename: frame.filename || getLastStackFrame(localStack).filename,
		function: frame.function || "?"
	}));
}
function getLastStackFrame(arr) {
	return arr[arr.length - 1] || {};
}
const defaultFunctionName = "<anonymous>";
/**
* Safely extract function name from itself
*/
function getFunctionName(fn) {
	try {
		if (!fn || typeof fn !== "function") return defaultFunctionName;
		return fn.name || defaultFunctionName;
	} catch (e) {
		return defaultFunctionName;
	}
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/instrument/handlers.js
const handlers = {};
const instrumented = {};
/** Add a handler function. */
function addHandler(type, handler) {
	handlers[type] = handlers[type] || [];
	handlers[type].push(handler);
}
/** Maybe run an instrumentation function, unless it was already called. */
function maybeInstrument(type, instrumentFn) {
	if (!instrumented[type]) {
		instrumentFn();
		instrumented[type] = true;
	}
}
/** Trigger handlers for a given instrumentation type. */
function triggerHandlers(type, data) {
	const typeHandlers = type && handlers[type];
	if (!typeHandlers) return;
	for (const handler of typeHandlers) try {
		handler(data);
	} catch (e) {
		DEBUG_BUILD$1 && logger.error(`Error while triggering instrumentation handler.\nType: ${type}\nName: ${getFunctionName(handler)}\nError:`, e);
	}
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/time.js
const ONE_SECOND_IN_MS = 1e3;
/**
* A partial definition of the [Performance Web API]{@link https://developer.mozilla.org/en-US/docs/Web/API/Performance}
* for accessing a high-resolution monotonic clock.
*/
/**
* Returns a timestamp in seconds since the UNIX epoch using the Date API.
*
* TODO(v8): Return type should be rounded.
*/
function dateTimestampInSeconds() {
	return Date.now() / ONE_SECOND_IN_MS;
}
/**
* Returns a wrapper around the native Performance API browser implementation, or undefined for browsers that do not
* support the API.
*
* Wrapping the native API works around differences in behavior from different browsers.
*/
function createUnixTimestampInSecondsFunc() {
	const { performance } = GLOBAL_OBJ;
	if (!performance || !performance.now) return dateTimestampInSeconds;
	const approxStartingTimeOrigin = Date.now() - performance.now();
	const timeOrigin = performance.timeOrigin == void 0 ? approxStartingTimeOrigin : performance.timeOrigin;
	return () => {
		return (timeOrigin + performance.now()) / ONE_SECOND_IN_MS;
	};
}
/**
* Returns a timestamp in seconds since the UNIX epoch using either the Performance or Date APIs, depending on the
* availability of the Performance API.
*
* BUG: Note that because of how browsers implement the Performance API, the clock might stop when the computer is
* asleep. This creates a skew between `dateTimestampInSeconds` and `timestampInSeconds`. The
* skew can grow to arbitrary amounts like days, weeks or months.
* See https://github.com/getsentry/sentry-javascript/issues/2590.
*/
const timestampInSeconds = createUnixTimestampInSecondsFunc();
(() => {
	const { performance } = GLOBAL_OBJ;
	if (!performance || !performance.now) return;
	const threshold = 3600 * 1e3;
	const performanceNow = performance.now();
	const dateNow = Date.now();
	const timeOriginDelta = performance.timeOrigin ? Math.abs(performance.timeOrigin + performanceNow - dateNow) : threshold;
	const timeOriginIsReliable = timeOriginDelta < threshold;
	const navigationStart = performance.timing && performance.timing.navigationStart;
	const navigationStartDelta = typeof navigationStart === "number" ? Math.abs(navigationStart + performanceNow - dateNow) : threshold;
	if (timeOriginIsReliable || navigationStartDelta < threshold) if (timeOriginDelta <= navigationStartDelta) return performance.timeOrigin;
	else return navigationStart;
	return dateNow;
})();
//#endregion
//#region node_modules/@sentry/utils/build/esm/instrument/globalError.js
let _oldOnErrorHandler = null;
/**
* Add an instrumentation handler for when an error is captured by the global error handler.
*
* Use at your own risk, this might break without changelog notice, only used internally.
* @hidden
*/
function addGlobalErrorInstrumentationHandler(handler) {
	const type = "error";
	addHandler(type, handler);
	maybeInstrument(type, instrumentError);
}
function instrumentError() {
	_oldOnErrorHandler = GLOBAL_OBJ.onerror;
	GLOBAL_OBJ.onerror = function(msg, url, line, column, error) {
		triggerHandlers("error", {
			column,
			error,
			line,
			msg,
			url
		});
		if (_oldOnErrorHandler && !_oldOnErrorHandler.__SENTRY_LOADER__) return _oldOnErrorHandler.apply(this, arguments);
		return false;
	};
	GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/instrument/globalUnhandledRejection.js
let _oldOnUnhandledRejectionHandler = null;
/**
* Add an instrumentation handler for when an unhandled promise rejection is captured.
*
* Use at your own risk, this might break without changelog notice, only used internally.
* @hidden
*/
function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
	const type = "unhandledrejection";
	addHandler(type, handler);
	maybeInstrument(type, instrumentUnhandledRejection);
}
function instrumentUnhandledRejection() {
	_oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
	GLOBAL_OBJ.onunhandledrejection = function(e) {
		triggerHandlers("unhandledrejection", e);
		if (_oldOnUnhandledRejectionHandler && !_oldOnUnhandledRejectionHandler.__SENTRY_LOADER__) return _oldOnUnhandledRejectionHandler.apply(this, arguments);
		return true;
	};
	GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/memo.js
/**
* Helper to decycle json objects
*/
function memoBuilder() {
	const hasWeakSet = typeof WeakSet === "function";
	const inner = hasWeakSet ? /* @__PURE__ */ new WeakSet() : [];
	function memoize(obj) {
		if (hasWeakSet) {
			if (inner.has(obj)) return true;
			inner.add(obj);
			return false;
		}
		for (let i = 0; i < inner.length; i++) if (inner[i] === obj) return true;
		inner.push(obj);
		return false;
	}
	function unmemoize(obj) {
		if (hasWeakSet) inner.delete(obj);
		else for (let i = 0; i < inner.length; i++) if (inner[i] === obj) {
			inner.splice(i, 1);
			break;
		}
	}
	return [memoize, unmemoize];
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/misc.js
/**
* UUID4 generator
*
* @returns string Generated UUID4.
*/
function uuid4() {
	const gbl = GLOBAL_OBJ;
	const crypto = gbl.crypto || gbl.msCrypto;
	let getRandomByte = () => Math.random() * 16;
	try {
		if (crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "");
		if (crypto && crypto.getRandomValues) getRandomByte = () => {
			const typedArray = new Uint8Array(1);
			crypto.getRandomValues(typedArray);
			return typedArray[0];
		};
	} catch (_) {}
	return "10000000100040008000100000000000".replace(/[018]/g, (c) => (c ^ (getRandomByte() & 15) >> c / 4).toString(16));
}
function getFirstException(event) {
	return event.exception && event.exception.values ? event.exception.values[0] : void 0;
}
/**
* Adds exception values, type and value to an synthetic Exception.
* @param event The event to modify.
* @param value Value of the exception.
* @param type Type of the exception.
* @hidden
*/
function addExceptionTypeValue(event, value, type) {
	const exception = event.exception = event.exception || {};
	const values = exception.values = exception.values || [];
	const firstException = values[0] = values[0] || {};
	if (!firstException.value) firstException.value = value || "";
	if (!firstException.type) firstException.type = type || "Error";
}
/**
* Adds exception mechanism data to a given event. Uses defaults if the second parameter is not passed.
*
* @param event The event to modify.
* @param newMechanism Mechanism data to add to the event.
* @hidden
*/
function addExceptionMechanism(event, newMechanism) {
	const firstException = getFirstException(event);
	if (!firstException) return;
	const defaultMechanism = {
		type: "generic",
		handled: true
	};
	const currentMechanism = firstException.mechanism;
	firstException.mechanism = {
		...defaultMechanism,
		...currentMechanism,
		...newMechanism
	};
	if (newMechanism && "data" in newMechanism) {
		const mergedData = {
			...currentMechanism && currentMechanism.data,
			...newMechanism.data
		};
		firstException.mechanism.data = mergedData;
	}
}
/**
* Checks whether or not we've already captured the given exception (note: not an identical exception - the very object
* in question), and marks it captured if not.
*
* This is useful because it's possible for an error to get captured by more than one mechanism. After we intercept and
* record an error, we rethrow it (assuming we've intercepted it before it's reached the top-level global handlers), so
* that we don't interfere with whatever effects the error might have had were the SDK not there. At that point, because
* the error has been rethrown, it's possible for it to bubble up to some other code we've instrumented. If it's not
* caught after that, it will bubble all the way up to the global handlers (which of course we also instrument). This
* function helps us ensure that even if we encounter the same error more than once, we only record it the first time we
* see it.
*
* Note: It will ignore primitives (always return `false` and not mark them as seen), as properties can't be set on
* them. {@link: Object.objectify} can be used on exceptions to convert any that are primitives into their equivalent
* object wrapper forms so that this check will always work. However, because we need to flag the exact object which
* will get rethrown, and because that rethrowing happens outside of the event processing pipeline, the objectification
* must be done before the exception captured.
*
* @param A thrown exception to check or flag as having been seen
* @returns `true` if the exception has already been captured, `false` if not (with the side effect of marking it seen)
*/
function checkOrSetAlreadyCaught(exception) {
	if (exception && exception.__sentry_captured__) return true;
	try {
		addNonEnumerableProperty(exception, "__sentry_captured__", true);
	} catch (err) {}
	return false;
}
/**
* Checks whether the given input is already an array, and if it isn't, wraps it in one.
*
* @param maybeArray Input to turn into an array, if necessary
* @returns The input, if already an array, or an array with the input as the only element, if not
*/
function arrayify$1(maybeArray) {
	return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/normalize.js
/**
* Recursively normalizes the given object.
*
* - Creates a copy to prevent original input mutation
* - Skips non-enumerable properties
* - When stringifying, calls `toJSON` if implemented
* - Removes circular references
* - Translates non-serializable values (`undefined`/`NaN`/functions) to serializable format
* - Translates known global objects/classes to a string representations
* - Takes care of `Error` object serialization
* - Optionally limits depth of final output
* - Optionally limits number of properties/elements included in any single object/array
*
* @param input The object to be normalized.
* @param depth The max depth to which to normalize the object. (Anything deeper stringified whole.)
* @param maxProperties The max number of elements or properties to be included in any single array or
* object in the normallized output.
* @returns A normalized version of the object, or `"**non-serializable**"` if any errors are thrown during normalization.
*/
function normalize(input, depth = 100, maxProperties = Infinity) {
	try {
		return visit("", input, depth, maxProperties);
	} catch (err) {
		return { ERROR: `**non-serializable** (${err})` };
	}
}
/** JSDoc */
function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
	const normalized = normalize(object, depth);
	if (jsonSize(normalized) > maxSize) return normalizeToSize(object, depth - 1, maxSize);
	return normalized;
}
/**
* Visits a node to perform normalization on it
*
* @param key The key corresponding to the given node
* @param value The node to be visited
* @param depth Optional number indicating the maximum recursion depth
* @param maxProperties Optional maximum number of properties/elements included in any single object/array
* @param memo Optional Memo class handling decycling
*/
function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
	const [memoize, unmemoize] = memo;
	if (value == null || [
		"number",
		"boolean",
		"string"
	].includes(typeof value) && !Number.isNaN(value)) return value;
	const stringified = stringifyValue(key, value);
	if (!stringified.startsWith("[object ")) return stringified;
	if (value["__sentry_skip_normalization__"]) return value;
	const remainingDepth = typeof value["__sentry_override_normalization_depth__"] === "number" ? value["__sentry_override_normalization_depth__"] : depth;
	if (remainingDepth === 0) return stringified.replace("object ", "");
	if (memoize(value)) return "[Circular ~]";
	const valueWithToJSON = value;
	if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") try {
		return visit("", valueWithToJSON.toJSON(), remainingDepth - 1, maxProperties, memo);
	} catch (err) {}
	const normalized = Array.isArray(value) ? [] : {};
	let numAdded = 0;
	const visitable = convertToPlainObject(value);
	for (const visitKey in visitable) {
		if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) continue;
		if (numAdded >= maxProperties) {
			normalized[visitKey] = "[MaxProperties ~]";
			break;
		}
		const visitValue = visitable[visitKey];
		normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
		numAdded++;
	}
	unmemoize(value);
	return normalized;
}
/**
* Stringify the given value. Handles various known special values and types.
*
* Not meant to be used on simple primitives which already have a string representation, as it will, for example, turn
* the number 1231 into "[Object Number]", nor on `null`, as it will throw.
*
* @param value The value to stringify
* @returns A stringified representation of the given value
*/
function stringifyValue(key, value) {
	try {
		if (key === "domain" && value && typeof value === "object" && value._events) return "[Domain]";
		if (key === "domainEmitter") return "[DomainEmitter]";
		if (typeof global !== "undefined" && value === global) return "[Global]";
		if (typeof window !== "undefined" && value === window) return "[Window]";
		if (typeof document !== "undefined" && value === document) return "[Document]";
		if (isVueViewModel(value)) return "[VueViewModel]";
		if (isSyntheticEvent(value)) return "[SyntheticEvent]";
		if (typeof value === "number" && value !== value) return "[NaN]";
		if (typeof value === "function") return `[Function: ${getFunctionName(value)}]`;
		if (typeof value === "symbol") return `[${String(value)}]`;
		if (typeof value === "bigint") return `[BigInt: ${String(value)}]`;
		const objName = getConstructorName(value);
		if (/^HTML(\w*)Element$/.test(objName)) return `[HTMLElement: ${objName}]`;
		return `[object ${objName}]`;
	} catch (err) {
		return `**non-serializable** (${err})`;
	}
}
function getConstructorName(value) {
	const prototype = Object.getPrototypeOf(value);
	return prototype ? prototype.constructor.name : "null prototype";
}
/** Calculates bytes size of input string */
function utf8Length(value) {
	return ~-encodeURI(value).split(/%..|./).length;
}
/** Calculates bytes size of input object */
function jsonSize(value) {
	return utf8Length(JSON.stringify(value));
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/syncpromise.js
/** SyncPromise internal states */
var States;
(function(States) {
	/** Pending */
	const PENDING = 0;
	States[States["PENDING"] = PENDING] = "PENDING";
	/** Resolved / OK */
	const RESOLVED = 1;
	States[States["RESOLVED"] = RESOLVED] = "RESOLVED";
	/** Rejected / Error */
	const REJECTED = 2;
	States[States["REJECTED"] = REJECTED] = "REJECTED";
})(States || (States = {}));
/**
* Creates a resolved sync promise.
*
* @param value the value to resolve the promise with
* @returns the resolved sync promise
*/
function resolvedSyncPromise(value) {
	return new SyncPromise((resolve) => {
		resolve(value);
	});
}
/**
* Creates a rejected sync promise.
*
* @param value the value to reject the promise with
* @returns the rejected sync promise
*/
function rejectedSyncPromise(reason) {
	return new SyncPromise((_, reject) => {
		reject(reason);
	});
}
/**
* Thenable class that behaves like a Promise and follows it's interface
* but is not async internally
*/
var SyncPromise = class SyncPromise {
	constructor(executor) {
		SyncPromise.prototype.__init.call(this);
		SyncPromise.prototype.__init2.call(this);
		SyncPromise.prototype.__init3.call(this);
		SyncPromise.prototype.__init4.call(this);
		this._state = States.PENDING;
		this._handlers = [];
		try {
			executor(this._resolve, this._reject);
		} catch (e) {
			this._reject(e);
		}
	}
	/** JSDoc */
	then(onfulfilled, onrejected) {
		return new SyncPromise((resolve, reject) => {
			this._handlers.push([
				false,
				(result) => {
					if (!onfulfilled) resolve(result);
					else try {
						resolve(onfulfilled(result));
					} catch (e) {
						reject(e);
					}
				},
				(reason) => {
					if (!onrejected) reject(reason);
					else try {
						resolve(onrejected(reason));
					} catch (e) {
						reject(e);
					}
				}
			]);
			this._executeHandlers();
		});
	}
	/** JSDoc */
	catch(onrejected) {
		return this.then((val) => val, onrejected);
	}
	/** JSDoc */
	finally(onfinally) {
		return new SyncPromise((resolve, reject) => {
			let val;
			let isRejected;
			return this.then((value) => {
				isRejected = false;
				val = value;
				if (onfinally) onfinally();
			}, (reason) => {
				isRejected = true;
				val = reason;
				if (onfinally) onfinally();
			}).then(() => {
				if (isRejected) {
					reject(val);
					return;
				}
				resolve(val);
			});
		});
	}
	/** JSDoc */
	__init() {
		this._resolve = (value) => {
			this._setResult(States.RESOLVED, value);
		};
	}
	/** JSDoc */
	__init2() {
		this._reject = (reason) => {
			this._setResult(States.REJECTED, reason);
		};
	}
	/** JSDoc */
	__init3() {
		this._setResult = (state, value) => {
			if (this._state !== States.PENDING) return;
			if (isThenable(value)) {
				value.then(this._resolve, this._reject);
				return;
			}
			this._state = state;
			this._value = value;
			this._executeHandlers();
		};
	}
	/** JSDoc */
	__init4() {
		this._executeHandlers = () => {
			if (this._state === States.PENDING) return;
			const cachedHandlers = this._handlers.slice();
			this._handlers = [];
			cachedHandlers.forEach((handler) => {
				if (handler[0]) return;
				if (this._state === States.RESOLVED) handler[1](this._value);
				if (this._state === States.REJECTED) handler[2](this._value);
				handler[0] = true;
			});
		};
	}
};
//#endregion
//#region node_modules/@sentry/utils/build/esm/promisebuffer.js
/**
* Creates an new PromiseBuffer object with the specified limit
* @param limit max number of promises that can be stored in the buffer
*/
function makePromiseBuffer(limit) {
	const buffer = [];
	function isReady() {
		return limit === void 0 || buffer.length < limit;
	}
	/**
	* Remove a promise from the queue.
	*
	* @param task Can be any PromiseLike<T>
	* @returns Removed promise.
	*/
	function remove(task) {
		return buffer.splice(buffer.indexOf(task), 1)[0] || Promise.resolve(void 0);
	}
	/**
	* Add a promise (representing an in-flight action) to the queue, and set it to remove itself on fulfillment.
	*
	* @param taskProducer A function producing any PromiseLike<T>; In previous versions this used to be `task:
	*        PromiseLike<T>`, but under that model, Promises were instantly created on the call-site and their executor
	*        functions therefore ran immediately. Thus, even if the buffer was full, the action still happened. By
	*        requiring the promise to be wrapped in a function, we can defer promise creation until after the buffer
	*        limit check.
	* @returns The original promise.
	*/
	function add(taskProducer) {
		if (!isReady()) return rejectedSyncPromise(new SentryError("Not adding Promise because buffer limit was reached."));
		const task = taskProducer();
		if (buffer.indexOf(task) === -1) buffer.push(task);
		task.then(() => remove(task)).then(null, () => remove(task).then(null, () => {}));
		return task;
	}
	/**
	* Wait for all promises in the queue to resolve or for timeout to expire, whichever comes first.
	*
	* @param timeout The time, in ms, after which to resolve to `false` if the queue is still non-empty. Passing `0` (or
	* not passing anything) will make the promise wait as long as it takes for the queue to drain before resolving to
	* `true`.
	* @returns A promise which will resolve to `true` if the queue is already empty or drains before the timeout, and
	* `false` otherwise
	*/
	function drain(timeout) {
		return new SyncPromise((resolve, reject) => {
			let counter = buffer.length;
			if (!counter) return resolve(true);
			const capturedSetTimeout = setTimeout(() => {
				if (timeout && timeout > 0) resolve(false);
			}, timeout);
			buffer.forEach((item) => {
				resolvedSyncPromise(item).then(() => {
					if (!--counter) {
						clearTimeout(capturedSetTimeout);
						resolve(true);
					}
				}, reject);
			});
		});
	}
	return {
		$: buffer,
		add,
		drain
	};
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/node-stack-trace.js
/**
* Does this filename look like it's part of the app code?
*/
function filenameIsInApp(filename, isNative = false) {
	return !(isNative || filename && !filename.startsWith("/") && !filename.match(/^[A-Z]:/) && !filename.startsWith(".") && !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//)) && filename !== void 0 && !filename.includes("node_modules/");
}
/** Node Stack line parser */
function node(getModule) {
	const FILENAME_MATCH = /^\s*[-]{4,}$/;
	const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;
	return (line) => {
		const lineMatch = line.match(FULL_MATCH);
		if (lineMatch) {
			let object;
			let method;
			let functionName;
			let typeName;
			let methodName;
			if (lineMatch[1]) {
				functionName = lineMatch[1];
				let methodStart = functionName.lastIndexOf(".");
				if (functionName[methodStart - 1] === ".") methodStart--;
				if (methodStart > 0) {
					object = functionName.slice(0, methodStart);
					method = functionName.slice(methodStart + 1);
					const objectEnd = object.indexOf(".Module");
					if (objectEnd > 0) {
						functionName = functionName.slice(objectEnd + 1);
						object = object.slice(0, objectEnd);
					}
				}
				typeName = void 0;
			}
			if (method) {
				typeName = object;
				methodName = method;
			}
			if (method === "<anonymous>") {
				methodName = void 0;
				functionName = void 0;
			}
			if (functionName === void 0) {
				methodName = methodName || "?";
				functionName = typeName ? `${typeName}.${methodName}` : methodName;
			}
			let filename = lineMatch[2] && lineMatch[2].startsWith("file://") ? lineMatch[2].slice(7) : lineMatch[2];
			const isNative = lineMatch[5] === "native";
			if (filename && filename.match(/\/[A-Z]:/)) filename = filename.slice(1);
			if (!filename && lineMatch[5] && !isNative) filename = lineMatch[5];
			return {
				filename,
				module: getModule ? getModule(filename) : void 0,
				function: functionName,
				lineno: _parseIntOrUndefined(lineMatch[3]),
				colno: _parseIntOrUndefined(lineMatch[4]),
				in_app: filenameIsInApp(filename || "", isNative)
			};
		}
		if (line.match(FILENAME_MATCH)) return { filename: line };
	};
}
/**
* Node.js stack line parser
*
* This is in @sentry/utils so it can be used from the Electron SDK in the browser for when `nodeIntegration == true`.
* This allows it to be used without referencing or importing any node specific code which causes bundlers to complain
*/
function nodeStackLineParser(getModule) {
	return [90, node(getModule)];
}
function _parseIntOrUndefined(input) {
	return parseInt(input || "", 10) || void 0;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/baggage.js
const SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
const SENTRY_BAGGAGE_KEY_PREFIX_REGEX = /^sentry-/;
/**
* Takes a baggage header and turns it into Dynamic Sampling Context, by extracting all the "sentry-" prefixed values
* from it.
*
* @param baggageHeader A very bread definition of a baggage header as it might appear in various frameworks.
* @returns The Dynamic Sampling Context that was found on `baggageHeader`, if there was any, `undefined` otherwise.
*/
function baggageHeaderToDynamicSamplingContext(baggageHeader) {
	const baggageObject = parseBaggageHeader(baggageHeader);
	if (!baggageObject) return;
	const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
		if (key.match(SENTRY_BAGGAGE_KEY_PREFIX_REGEX)) {
			const nonPrefixedKey = key.slice(7);
			acc[nonPrefixedKey] = value;
		}
		return acc;
	}, {});
	if (Object.keys(dynamicSamplingContext).length > 0) return dynamicSamplingContext;
	else return;
}
/**
* Turns a Dynamic Sampling Object into a baggage header by prefixing all the keys on the object with "sentry-".
*
* @param dynamicSamplingContext The Dynamic Sampling Context to turn into a header. For convenience and compatibility
* with the `getDynamicSamplingContext` method on the Transaction class ,this argument can also be `undefined`. If it is
* `undefined` the function will return `undefined`.
* @returns a baggage header, created from `dynamicSamplingContext`, or `undefined` either if `dynamicSamplingContext`
* was `undefined`, or if `dynamicSamplingContext` didn't contain any values.
*/
function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
	if (!dynamicSamplingContext) return;
	return objectToBaggageHeader(Object.entries(dynamicSamplingContext).reduce((acc, [dscKey, dscValue]) => {
		if (dscValue) acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
		return acc;
	}, {}));
}
/**
* Take a baggage header and parse it into an object.
*/
function parseBaggageHeader(baggageHeader) {
	if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) return;
	if (Array.isArray(baggageHeader)) return baggageHeader.reduce((acc, curr) => {
		const currBaggageObject = baggageHeaderToObject(curr);
		Object.entries(currBaggageObject).forEach(([key, value]) => {
			acc[key] = value;
		});
		return acc;
	}, {});
	return baggageHeaderToObject(baggageHeader);
}
/**
* Will parse a baggage header, which is a simple key-value map, into a flat object.
*
* @param baggageHeader The baggage header to parse.
* @returns a flat object containing all the key-value pairs from `baggageHeader`.
*/
function baggageHeaderToObject(baggageHeader) {
	return baggageHeader.split(",").map((baggageEntry) => baggageEntry.split("=").map((keyOrValue) => decodeURIComponent(keyOrValue.trim()))).reduce((acc, [key, value]) => {
		if (key && value) acc[key] = value;
		return acc;
	}, {});
}
/**
* Turns a flat object (key-value pairs) into a baggage header, which is also just key-value pairs.
*
* @param object The object to turn into a baggage header.
* @returns a baggage header string, or `undefined` if the object didn't have any values, since an empty baggage header
* is not spec compliant.
*/
function objectToBaggageHeader(object) {
	if (Object.keys(object).length === 0) return;
	return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
		const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
		const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
		if (newBaggageHeader.length > 8192) {
			DEBUG_BUILD$1 && logger.warn(`Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`);
			return baggageHeader;
		} else return newBaggageHeader;
	}, "");
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/tracing.js
const TRACEPARENT_REGEXP = /* @__PURE__ */ new RegExp("^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$");
/**
* Create sentry-trace header from span context values.
*/
function generateSentryTraceHeader(traceId = uuid4(), spanId = uuid4().substring(16), sampled) {
	let sampledString = "";
	if (sampled !== void 0) sampledString = sampled ? "-1" : "-0";
	return `${traceId}-${spanId}${sampledString}`;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/envelope.js
/**
* Creates an envelope.
* Make sure to always explicitly provide the generic to this function
* so that the envelope types resolve correctly.
*/
function createEnvelope(headers, items = []) {
	return [headers, items];
}
/**
* Add an item to an envelope.
* Make sure to always explicitly provide the generic to this function
* so that the envelope types resolve correctly.
*/
function addItemToEnvelope(envelope, newItem) {
	const [headers, items] = envelope;
	return [headers, [...items, newItem]];
}
/**
* Convenience function to loop through the items and item types of an envelope.
* (This function was mostly created because working with envelope types is painful at the moment)
*
* If the callback returns true, the rest of the items will be skipped.
*/
function forEachEnvelopeItem(envelope, callback) {
	const envelopeItems = envelope[1];
	for (const envelopeItem of envelopeItems) {
		const envelopeItemType = envelopeItem[0].type;
		if (callback(envelopeItem, envelopeItemType)) return true;
	}
	return false;
}
/**
* Encode a string to UTF8 array.
*/
function encodeUTF8(input) {
	return GLOBAL_OBJ.__SENTRY__ && GLOBAL_OBJ.__SENTRY__.encodePolyfill ? GLOBAL_OBJ.__SENTRY__.encodePolyfill(input) : new TextEncoder().encode(input);
}
/**
* Serializes an envelope.
*/
function serializeEnvelope(envelope) {
	const [envHeaders, items] = envelope;
	let parts = JSON.stringify(envHeaders);
	function append(next) {
		if (typeof parts === "string") parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
		else parts.push(typeof next === "string" ? encodeUTF8(next) : next);
	}
	for (const item of items) {
		const [itemHeaders, payload] = item;
		append(`\n${JSON.stringify(itemHeaders)}\n`);
		if (typeof payload === "string" || payload instanceof Uint8Array) append(payload);
		else {
			let stringifiedPayload;
			try {
				stringifiedPayload = JSON.stringify(payload);
			} catch (e) {
				stringifiedPayload = JSON.stringify(normalize(payload));
			}
			append(stringifiedPayload);
		}
	}
	return typeof parts === "string" ? parts : concatBuffers(parts);
}
function concatBuffers(buffers) {
	const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
	const merged = new Uint8Array(totalLength);
	let offset = 0;
	for (const buffer of buffers) {
		merged.set(buffer, offset);
		offset += buffer.length;
	}
	return merged;
}
/**
* Creates envelope item for a single span
*/
function createSpanEnvelopeItem(spanJson) {
	return [{ type: "span" }, spanJson];
}
/**
* Creates attachment envelope items
*/
function createAttachmentEnvelopeItem(attachment) {
	const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
	return [dropUndefinedKeys({
		type: "attachment",
		length: buffer.length,
		filename: attachment.filename,
		content_type: attachment.contentType,
		attachment_type: attachment.attachmentType
	}), buffer];
}
const ITEM_TYPE_TO_DATA_CATEGORY_MAP = {
	session: "session",
	sessions: "session",
	attachment: "attachment",
	transaction: "transaction",
	event: "error",
	client_report: "internal",
	user_report: "default",
	profile: "profile",
	profile_chunk: "profile",
	replay_event: "replay",
	replay_recording: "replay",
	check_in: "monitor",
	feedback: "feedback",
	span: "span",
	statsd: "metric_bucket"
};
/**
* Maps the type of an envelope item to a data category.
*/
function envelopeItemTypeToDataCategory(type) {
	return ITEM_TYPE_TO_DATA_CATEGORY_MAP[type];
}
/** Extracts the minimal SDK info from the metadata or an events */
function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
	if (!metadataOrEvent || !metadataOrEvent.sdk) return;
	const { name, version } = metadataOrEvent.sdk;
	return {
		name,
		version
	};
}
/**
* Creates event envelope headers, based on event, sdk info and tunnel
* Note: This function was extracted from the core package to make it available in Replay
*/
function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
	const dynamicSamplingContext = event.sdkProcessingMetadata && event.sdkProcessingMetadata.dynamicSamplingContext;
	return {
		event_id: event.event_id,
		sent_at: (/* @__PURE__ */ new Date()).toISOString(),
		...sdkInfo && { sdk: sdkInfo },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) },
		...dynamicSamplingContext && { trace: dropUndefinedKeys({ ...dynamicSamplingContext }) }
	};
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/clientreport.js
/**
* Creates client report envelope
* @param discarded_events An array of discard events
* @param dsn A DSN that can be set on the header. Optional.
*/
function createClientReportEnvelope(discarded_events, dsn, timestamp) {
	const clientReportItem = [{ type: "client_report" }, {
		timestamp: timestamp || dateTimestampInSeconds(),
		discarded_events
	}];
	return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/ratelimit.js
const DEFAULT_RETRY_AFTER = 60 * 1e3;
/**
* Extracts Retry-After value from the request header or returns default value
* @param header string representation of 'Retry-After' header
* @param now current unix timestamp
*
*/
function parseRetryAfterHeader(header, now = Date.now()) {
	const headerDelay = parseInt(`${header}`, 10);
	if (!isNaN(headerDelay)) return headerDelay * 1e3;
	const headerDate = Date.parse(`${header}`);
	if (!isNaN(headerDate)) return headerDate - now;
	return DEFAULT_RETRY_AFTER;
}
/**
* Gets the time that the given category is disabled until for rate limiting.
* In case no category-specific limit is set but a general rate limit across all categories is active,
* that time is returned.
*
* @return the time in ms that the category is disabled until or 0 if there's no active rate limit.
*/
function disabledUntil(limits, dataCategory) {
	return limits[dataCategory] || limits.all || 0;
}
/**
* Checks if a category is rate limited
*/
function isRateLimited(limits, dataCategory, now = Date.now()) {
	return disabledUntil(limits, dataCategory) > now;
}
/**
* Update ratelimits from incoming headers.
*
* @return the updated RateLimits object.
*/
function updateRateLimits(limits, { statusCode, headers }, now = Date.now()) {
	const updatedRateLimits = { ...limits };
	const rateLimitHeader = headers && headers["x-sentry-rate-limits"];
	const retryAfterHeader = headers && headers["retry-after"];
	if (rateLimitHeader)
 /**
	* rate limit headers are of the form
	*     <header>,<header>,..
	* where each <header> is of the form
	*     <retry_after>: <categories>: <scope>: <reason_code>: <namespaces>
	* where
	*     <retry_after> is a delay in seconds
	*     <categories> is the event type(s) (error, transaction, etc) being rate limited and is of the form
	*         <category>;<category>;...
	*     <scope> is what's being limited (org, project, or key) - ignored by SDK
	*     <reason_code> is an arbitrary string like "org_quota" - ignored by SDK
	*     <namespaces> Semicolon-separated list of metric namespace identifiers. Defines which namespace(s) will be affected.
	*         Only present if rate limit applies to the metric_bucket data category.
	*/
	for (const limit of rateLimitHeader.trim().split(",")) {
		const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
		const headerDelay = parseInt(retryAfter, 10);
		const delay = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
		if (!categories) updatedRateLimits.all = now + delay;
		else for (const category of categories.split(";")) if (category === "metric_bucket") {
			if (!namespaces || namespaces.split(";").includes("custom")) updatedRateLimits[category] = now + delay;
		} else updatedRateLimits[category] = now + delay;
	}
	else if (retryAfterHeader) updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
	else if (statusCode === 429) updatedRateLimits.all = now + 60 * 1e3;
	return updatedRateLimits;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/eventbuilder.js
/**
* Extracts stack frames from the error.stack string
*/
function parseStackFrames(stackParser, error) {
	return stackParser(error.stack || "", 1);
}
/**
* Extracts stack frames from the error and builds a Sentry Exception
*/
function exceptionFromError(stackParser, error) {
	const exception = {
		type: error.name || error.constructor.name,
		value: error.message
	};
	const frames = parseStackFrames(stackParser, error);
	if (frames.length) exception.stacktrace = { frames };
	return exception;
}
/** If a plain object has a property that is an `Error`, return this error. */
function getErrorPropertyFromObject(obj) {
	for (const prop in obj) if (Object.prototype.hasOwnProperty.call(obj, prop)) {
		const value = obj[prop];
		if (value instanceof Error) return value;
	}
}
function getMessageForObject(exception) {
	if ("name" in exception && typeof exception.name === "string") {
		let message = `'${exception.name}' captured as exception`;
		if ("message" in exception && typeof exception.message === "string") message += ` with message '${exception.message}'`;
		return message;
	} else if ("message" in exception && typeof exception.message === "string") return exception.message;
	const keys = extractExceptionKeysForMessage(exception);
	if (isErrorEvent$1(exception)) return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
	const className = getObjectClassName(exception);
	return `${className && className !== "Object" ? `'${className}'` : "Object"} captured as exception with keys: ${keys}`;
}
function getObjectClassName(obj) {
	try {
		const prototype = Object.getPrototypeOf(obj);
		return prototype ? prototype.constructor.name : void 0;
	} catch (e) {}
}
function getException(client, mechanism, exception, hint) {
	if (isError(exception)) return [exception, void 0];
	mechanism.synthetic = true;
	if (isPlainObject(exception)) {
		const normalizeDepth = client && client.getOptions().normalizeDepth;
		const extras = { ["__serialized__"]: normalizeToSize(exception, normalizeDepth) };
		const errorFromProp = getErrorPropertyFromObject(exception);
		if (errorFromProp) return [errorFromProp, extras];
		const message = getMessageForObject(exception);
		const ex = hint && hint.syntheticException || new Error(message);
		ex.message = message;
		return [ex, extras];
	}
	const ex = hint && hint.syntheticException || new Error(exception);
	ex.message = `${exception}`;
	return [ex, void 0];
}
/**
* Builds and Event from a Exception
* @hidden
*/
function eventFromUnknownInput(client, stackParser, exception, hint) {
	const mechanism = hint && hint.data && hint.data.mechanism || {
		handled: true,
		type: "generic"
	};
	const [ex, extras] = getException(client, mechanism, exception, hint);
	const event = { exception: { values: [exceptionFromError(stackParser, ex)] } };
	if (extras) event.extra = extras;
	addExceptionTypeValue(event, void 0, void 0);
	addExceptionMechanism(event, mechanism);
	return {
		...event,
		event_id: hint && hint.event_id
	};
}
/**
* Builds and Event from a Message
* @hidden
*/
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
	const event = {
		event_id: hint && hint.event_id,
		level
	};
	if (attachStacktrace && hint && hint.syntheticException) {
		const frames = parseStackFrames(stackParser, hint.syntheticException);
		if (frames.length) event.exception = { values: [{
			value: message,
			stacktrace: { frames }
		}] };
	}
	if (isParameterizedString(message)) {
		const { __sentry_template_string__, __sentry_template_values__ } = message;
		event.logentry = {
			message: __sentry_template_string__,
			params: __sentry_template_values__
		};
		return event;
	}
	event.message = message;
	return event;
}
//#endregion
//#region node_modules/@sentry/utils/build/esm/propagationContext.js
/**
* Returns a new minimal propagation context
*/
function generatePropagationContext() {
	return {
		traceId: uuid4(),
		spanId: uuid4().substring(16)
	};
}
//#endregion
//#region src/utils.ts
/**
* Checks whether the given input is already an array, and if it isn't, wraps it in one.
*
* @param maybeArray Input to turn into an array, if necessary
* @returns The input, if already an array, or an array with the input as the only element, if not
*/
function arrayify(maybeArray) {
	return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}
/**
* Get the closes package.json from a given starting point upwards.
* This handles a few edge cases:
* * Check if a given file package.json appears to be an actual NPM package.json file
* * Stop at the home dir, to avoid looking too deeply
*/
function getPackageJson({ cwd, stopAt } = {}) {
	return lookupPackageJson(cwd ?? process.cwd(), path.normalize(stopAt ?? os.homedir()));
}
function parseMajorVersion(version) {
	if (version.startsWith("v")) version = version.slice(1);
	const match = version.match(/^[\^~]?(\d+)(\.\d+)?(\.\d+)?(-.+)?/);
	if (match) return parseInt(match[1], 10);
	const coerced = parseInt(version, 10);
	if (!Number.isNaN(coerced)) return coerced;
	const gteLteMatch = version.match(/^[<>]=\s*(\d+)(\.\d+)?(\.\d+)?(-.+)?/);
	if (gteLteMatch) return parseInt(gteLteMatch[1], 10);
	const ltMatch = version.match(/^<\s*(\d+)(\.\d+)?(\.\d+)?(-.+)?/);
	if (ltMatch) {
		const major = parseInt(ltMatch[1], 10);
		if (typeof ltMatch[2] === "string" && parseInt(ltMatch[2].slice(1), 10) > 0 || typeof ltMatch[3] === "string" && parseInt(ltMatch[3].slice(1), 10) > 0) return major;
		return major - 1;
	}
	const gtMatch = version.match(/^>\s*(\d+)(\.\d+)?(\.\d+)?(-.+)?/);
	if (gtMatch) return parseInt(gtMatch[1], 10);
}
const PACKAGES_TO_INCLUDE_VERSION = [
	"react",
	"@angular/core",
	"vue",
	"ember-source",
	"svelte",
	"@sveltejs/kit",
	"webpack",
	"vite",
	"gatsby",
	"next",
	"remix",
	"rollup",
	"esbuild"
];
function getDependencies(packageJson) {
	const dependencies = Object.assign({}, packageJson["devDependencies"] ?? {}, packageJson["dependencies"] ?? {});
	const deps = Object.keys(dependencies).sort();
	return {
		deps,
		depsVersions: deps.reduce((depsVersions, depName) => {
			if (PACKAGES_TO_INCLUDE_VERSION.includes(depName)) {
				const version = dependencies[depName];
				const majorVersion = parseMajorVersion(version);
				if (majorVersion) depsVersions[depName] = majorVersion;
			}
			return depsVersions;
		}, {})
	};
}
function lookupPackageJson(cwd, stopAt) {
	const jsonPath = findUp.sync((dirName) => {
		if (path.normalize(dirName) === stopAt) return findUp.stop;
		return findUp.sync.exists(dirName + "/package.json") ? "package.json" : void 0;
	}, { cwd });
	if (!jsonPath) return;
	try {
		const jsonStr = fs.readFileSync(jsonPath, "utf8");
		const json = JSON.parse(jsonStr);
		if ("name" in json || "private" in json) return json;
	} catch (error) {}
	return lookupPackageJson(path.dirname(path.resolve(jsonPath + "/..")), stopAt);
}
/**
* Deterministically hashes a string and turns the hash into a uuid.
*/
function stringToUUID(str) {
	const sha256Hash = crypto.createHash("sha256").update(str).digest("hex");
	const v4variant = [
		"8",
		"9",
		"a",
		"b"
	][sha256Hash.substring(16, 17).charCodeAt(0) % 4];
	return (sha256Hash.substring(0, 8) + "-" + sha256Hash.substring(8, 12) + "-4" + sha256Hash.substring(13, 16) + "-" + v4variant + sha256Hash.substring(17, 20) + "-" + sha256Hash.substring(20, 32)).toLowerCase();
}
function gitRevision() {
	let gitRevision;
	try {
		gitRevision = childProcess.execSync("git rev-parse HEAD", { stdio: [
			"ignore",
			"pipe",
			"ignore"
		] }).toString().trim();
	} catch (e) {}
	return gitRevision;
}
/**
* Tries to guess a release name based on environmental data.
*/
function determineReleaseName() {
	const possibleReleaseNameOfGitProvider = process.env["GITHUB_SHA"] || process.env["CI_MERGE_REQUEST_SOURCE_BRANCH_SHA"] || process.env["CI_BUILD_REF"] || process.env["CI_COMMIT_SHA"] || process.env["BITBUCKET_COMMIT"];
	const possibleReleaseNameOfCiProvidersWithSpecificEnvVar = process.env["APPVEYOR_PULL_REQUEST_HEAD_COMMIT"] || process.env["APPVEYOR_REPO_COMMIT"] || process.env["CODEBUILD_RESOLVED_SOURCE_VERSION"] || process.env["AWS_COMMIT_ID"] || process.env["BUILD_SOURCEVERSION"] || process.env["GIT_CLONE_COMMIT_HASH"] || process.env["BUDDY_EXECUTION_REVISION"] || process.env["BUILDKITE_COMMIT"] || process.env["CIRCLE_SHA1"] || process.env["CIRRUS_CHANGE_IN_REPO"] || process.env["CF_REVISION"] || process.env["CM_COMMIT"] || process.env["CF_PAGES_COMMIT_SHA"] || process.env["DRONE_COMMIT_SHA"] || process.env["FC_GIT_COMMIT_SHA"] || process.env["HEROKU_TEST_RUN_COMMIT_VERSION"] || process.env["HEROKU_SLUG_COMMIT"] || process.env["RAILWAY_GIT_COMMIT_SHA"] || process.env["RENDER_GIT_COMMIT"] || process.env["SEMAPHORE_GIT_SHA"] || process.env["TRAVIS_PULL_REQUEST_SHA"] || process.env["VERCEL_GIT_COMMIT_SHA"] || process.env["VERCEL_GITHUB_COMMIT_SHA"] || process.env["VERCEL_GITLAB_COMMIT_SHA"] || process.env["VERCEL_BITBUCKET_COMMIT_SHA"] || process.env["ZEIT_GITHUB_COMMIT_SHA"] || process.env["ZEIT_GITLAB_COMMIT_SHA"] || process.env["ZEIT_BITBUCKET_COMMIT_SHA"];
	const possibleReleaseNameOfCiProvidersWithGenericEnvVar = process.env["CI_COMMIT_ID"] || process.env["SOURCE_COMMIT"] || process.env["SOURCE_VERSION"] || process.env["GIT_COMMIT"] || process.env["COMMIT_REF"] || process.env["BUILD_VCS_NUMBER"] || process.env["CI_COMMIT_SHA"];
	return possibleReleaseNameOfGitProvider || possibleReleaseNameOfCiProvidersWithSpecificEnvVar || possibleReleaseNameOfCiProvidersWithGenericEnvVar || gitRevision();
}
/**
* Generates code for the global injector which is responsible for setting the global
* `SENTRY_RELEASE` & `SENTRY_BUILD_INFO` variables.
*/
function generateReleaseInjectorCode({ release, injectBuildInformation }) {
	let code = `e.SENTRY_RELEASE={id:${JSON.stringify(release)}};`;
	if (injectBuildInformation) {
		const buildInfo = getBuildInformation();
		code += `e.SENTRY_BUILD_INFO=${JSON.stringify(buildInfo)};`;
	}
	return new CodeInjection(code);
}
function generateModuleMetadataInjectorCode(metadata) {
	return new CodeInjection(`e._sentryModuleMetadata=e._sentryModuleMetadata||{},e._sentryModuleMetadata[(new e.Error).stack]=function(e){for(var n=1;n<arguments.length;n++){var a=arguments[n];if(null!=a)for(var t in a)a.hasOwnProperty(t)&&(e[t]=a[t])}return e}({},e._sentryModuleMetadata[(new e.Error).stack],${JSON.stringify(metadata)});`);
}
function getBuildInformation() {
	const packageJson = getPackageJson();
	const { deps, depsVersions } = packageJson ? getDependencies(packageJson) : {
		deps: [],
		depsVersions: {}
	};
	return {
		deps,
		depsVersions,
		nodeVersion: parseMajorVersion(process.version)
	};
}
function stripQueryAndHashFromPath(path) {
	return path.split("?")[0].split("#")[0];
}
function replaceBooleanFlagsInCode(code, replacementValues) {
	const ms = new MagicString(code);
	Object.keys(replacementValues).forEach((key) => {
		const value = replacementValues[key];
		if (typeof value === "boolean") ms.replaceAll(key, JSON.stringify(value));
	});
	if (ms.hasChanged()) return {
		code: ms.toString(),
		map: ms.generateMap({ hires: "boundary" })
	};
	return null;
}
function getTurborepoEnvPassthroughWarning(envVarName) {
	return process.env["TURBO_HASH"] ? `\nYou seem to be using Turborepo, did you forget to put ${envVarName} in \`passThroughEnv\`? https://turbo.build/repo/docs/reference/configuration#passthroughenv` : "";
}
/**
* Gets the projects from the project option. This might be a single project or an array of projects.
*/
function getProjects(project) {
	if (Array.isArray(project)) return project;
	if (project) return [project];
}
/**
* Inlined functionality from @sentry/cli helper code to add `--ignore` options.
*
* Temporary workaround until we expose a function for injecting debug IDs. Currently, we directly call `execute` with CLI args to inject them.
*/
function serializeIgnoreOptions(ignoreValue) {
	return (Array.isArray(ignoreValue) ? ignoreValue : typeof ignoreValue === "string" ? [ignoreValue] : ["node_modules"]).reduce((acc, value) => acc.concat(["--ignore", String(value)]), []);
}
/**
* Checks if a chunk contains only import/export statements and no substantial code.
*
* In Vite MPA (multi-page application) mode, HTML entry points create "facade" chunks
* that only contain import statements to load shared modules. These should not have
* Sentry code injected. However, in SPA mode, the main bundle also has an HTML facade
* but contains substantial application code that SHOULD have debug IDs injected.
*
* @ref https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/829
* @ref https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/839
*/
function containsOnlyImports(code) {
	return code.replace(/^\s*import\s+(?:'[^'\n]*'|"[^"\n]*"|`[^`\n]*`)[\s;]*$/gm, "").replace(/^\s*import\b[^'"`\n]*\bfrom\s+(?:'[^'\n]*'|"[^"\n]*"|`[^`\n]*`)[\s;]*$/gm, "").replace(/^\s*export\b[^'"`\n]*\bfrom\s+(?:'[^'\n]*'|"[^"\n]*"|`[^`\n]*`)[\s;]*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/["']use strict["']\s*;?/g, "").trim().length === 0;
}
var CodeInjection = class CodeInjection {
	constructor(body = "") {
		this.body = body;
		this.header = `!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{};`;
		this.footer = "}catch(e){}}();";
	}
	code() {
		if (this.isEmpty()) return "";
		return this.header + this.body + this.footer;
	}
	isEmpty() {
		return this.body.length === 0;
	}
	append(code) {
		if (code instanceof CodeInjection) this.body += code.body;
		else this.body += code;
	}
	clear() {
		this.body = "";
	}
	clone() {
		return new CodeInjection(this.body);
	}
};
//#endregion
//#region src/glob.ts
function globFiles(patterns, options) {
	return glob(patterns, {
		absolute: true,
		nodir: true,
		...options
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/debug-build.js
/**
* This serves as a build time flag that will be true by default, but false in non-debug builds or if users replace `__SENTRY_DEBUG__` in their generated code.
*
* ATTENTION: This constant must never cross package boundaries (i.e. be exported) to guarantee that it can be used for tree shaking.
*/
const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
//#endregion
//#region node_modules/@sentry/core/build/esm/carrier.js
/**
* An object that contains globally accessible properties and maintains a scope stack.
* @hidden
*/
/**
* Returns the global shim registry.
*
* FIXME: This function is problematic, because despite always returning a valid Carrier,
* it has an optional `__SENTRY__` property, which then in turn requires us to always perform an unnecessary check
* at the call-site. We always access the carrier through this function, so we can guarantee that `__SENTRY__` is there.
**/
function getMainCarrier() {
	getSentryCarrier(GLOBAL_OBJ);
	return GLOBAL_OBJ;
}
/** Will either get the existing sentry carrier, or create a new one. */
function getSentryCarrier(carrier) {
	const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
	__SENTRY__.version = __SENTRY__.version || "8.30.0";
	return __SENTRY__[SDK_VERSION] = __SENTRY__["8.30.0"] || {};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/session.js
/**
* Creates a new `Session` object by setting certain default parameters. If optional @param context
* is passed, the passed properties are applied to the session object.
*
* @param context (optional) additional properties to be applied to the returned session object
*
* @returns a new `Session` object
*/
function makeSession(context) {
	const startingTime = timestampInSeconds();
	const session = {
		sid: uuid4(),
		init: true,
		timestamp: startingTime,
		started: startingTime,
		duration: 0,
		status: "ok",
		errors: 0,
		ignoreDuration: false,
		toJSON: () => sessionToJSON(session)
	};
	if (context) updateSession(session, context);
	return session;
}
/**
* Updates a session object with the properties passed in the context.
*
* Note that this function mutates the passed object and returns void.
* (Had to do this instead of returning a new and updated session because closing and sending a session
* makes an update to the session after it was passed to the sending logic.
* @see BaseClient.captureSession )
*
* @param session the `Session` to update
* @param context the `SessionContext` holding the properties that should be updated in @param session
*/
function updateSession(session, context = {}) {
	if (context.user) {
		if (!session.ipAddress && context.user.ip_address) session.ipAddress = context.user.ip_address;
		if (!session.did && !context.did) session.did = context.user.id || context.user.email || context.user.username;
	}
	session.timestamp = context.timestamp || timestampInSeconds();
	if (context.abnormal_mechanism) session.abnormal_mechanism = context.abnormal_mechanism;
	if (context.ignoreDuration) session.ignoreDuration = context.ignoreDuration;
	if (context.sid) session.sid = context.sid.length === 32 ? context.sid : uuid4();
	if (context.init !== void 0) session.init = context.init;
	if (!session.did && context.did) session.did = `${context.did}`;
	if (typeof context.started === "number") session.started = context.started;
	if (session.ignoreDuration) session.duration = void 0;
	else if (typeof context.duration === "number") session.duration = context.duration;
	else {
		const duration = session.timestamp - session.started;
		session.duration = duration >= 0 ? duration : 0;
	}
	if (context.release) session.release = context.release;
	if (context.environment) session.environment = context.environment;
	if (!session.ipAddress && context.ipAddress) session.ipAddress = context.ipAddress;
	if (!session.userAgent && context.userAgent) session.userAgent = context.userAgent;
	if (typeof context.errors === "number") session.errors = context.errors;
	if (context.status) session.status = context.status;
}
/**
* Closes a session by setting its status and updating the session object with it.
* Internally calls `updateSession` to update the passed session object.
*
* Note that this function mutates the passed session (@see updateSession for explanation).
*
* @param session the `Session` object to be closed
* @param status the `SessionStatus` with which the session was closed. If you don't pass a status,
*               this function will keep the previously set status, unless it was `'ok'` in which case
*               it is changed to `'exited'`.
*/
function closeSession(session, status) {
	let context = {};
	if (status) context = { status };
	else if (session.status === "ok") context = { status: "exited" };
	updateSession(session, context);
}
/**
* Serializes a passed session object to a JSON object with a slightly different structure.
* This is necessary because the Sentry backend requires a slightly different schema of a session
* than the one the JS SDKs use internally.
*
* @param session the session to be converted
*
* @returns a JSON object of the passed session
*/
function sessionToJSON(session) {
	return dropUndefinedKeys({
		sid: `${session.sid}`,
		init: session.init,
		started: (/* @__PURE__ */ new Date(session.started * 1e3)).toISOString(),
		timestamp: (/* @__PURE__ */ new Date(session.timestamp * 1e3)).toISOString(),
		status: session.status,
		errors: session.errors,
		did: typeof session.did === "number" || typeof session.did === "string" ? `${session.did}` : void 0,
		duration: session.duration,
		abnormal_mechanism: session.abnormal_mechanism,
		attrs: {
			release: session.release,
			environment: session.environment,
			ip_address: session.ipAddress,
			user_agent: session.userAgent
		}
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/spanOnScope.js
const SCOPE_SPAN_FIELD = "_sentrySpan";
/**
* Set the active span for a given scope.
* NOTE: This should NOT be used directly, but is only used internally by the trace methods.
*/
function _setSpanForScope(scope, span) {
	if (span) addNonEnumerableProperty(scope, SCOPE_SPAN_FIELD, span);
	else delete scope[SCOPE_SPAN_FIELD];
}
/**
* Get the active span for a given scope.
* NOTE: This should NOT be used directly, but is only used internally by the trace methods.
*/
function _getSpanForScope(scope) {
	return scope[SCOPE_SPAN_FIELD];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/scope.js
/**
* Default value for maximum number of breadcrumbs added to an event.
*/
const DEFAULT_MAX_BREADCRUMBS = 100;
/**
* Holds additional event information.
*/
const Scope = class ScopeClass {
	/** Flag if notifying is happening. */
	/** Callback for client to receive scope changes. */
	/** Callback list that will be called during event processing. */
	/** Array of breadcrumbs. */
	/** User */
	/** Tags */
	/** Extra */
	/** Contexts */
	/** Attachments */
	/** Propagation Context for distributed tracing */
	/**
	* A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
	* sent to Sentry
	*/
	/** Fingerprint */
	/** Severity */
	/**
	* Transaction Name
	*
	* IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
	* It's purpose is to assign a transaction to the scope that's added to non-transaction events.
	*/
	/** Session */
	/** Request Mode Session Status */
	/** The client on this scope */
	/** Contains the last event id of a captured event.  */
	constructor() {
		this._notifyingListeners = false;
		this._scopeListeners = [];
		this._eventProcessors = [];
		this._breadcrumbs = [];
		this._attachments = [];
		this._user = {};
		this._tags = {};
		this._extra = {};
		this._contexts = {};
		this._sdkProcessingMetadata = {};
		this._propagationContext = generatePropagationContext();
	}
	/**
	* @inheritDoc
	*/
	clone() {
		const newScope = new ScopeClass();
		newScope._breadcrumbs = [...this._breadcrumbs];
		newScope._tags = { ...this._tags };
		newScope._extra = { ...this._extra };
		newScope._contexts = { ...this._contexts };
		newScope._user = this._user;
		newScope._level = this._level;
		newScope._session = this._session;
		newScope._transactionName = this._transactionName;
		newScope._fingerprint = this._fingerprint;
		newScope._eventProcessors = [...this._eventProcessors];
		newScope._requestSession = this._requestSession;
		newScope._attachments = [...this._attachments];
		newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
		newScope._propagationContext = { ...this._propagationContext };
		newScope._client = this._client;
		newScope._lastEventId = this._lastEventId;
		_setSpanForScope(newScope, _getSpanForScope(this));
		return newScope;
	}
	/**
	* @inheritDoc
	*/
	setClient(client) {
		this._client = client;
	}
	/**
	* @inheritDoc
	*/
	setLastEventId(lastEventId) {
		this._lastEventId = lastEventId;
	}
	/**
	* @inheritDoc
	*/
	getClient() {
		return this._client;
	}
	/**
	* @inheritDoc
	*/
	lastEventId() {
		return this._lastEventId;
	}
	/**
	* @inheritDoc
	*/
	addScopeListener(callback) {
		this._scopeListeners.push(callback);
	}
	/**
	* @inheritDoc
	*/
	addEventProcessor(callback) {
		this._eventProcessors.push(callback);
		return this;
	}
	/**
	* @inheritDoc
	*/
	setUser(user) {
		this._user = user || {
			email: void 0,
			id: void 0,
			ip_address: void 0,
			username: void 0
		};
		if (this._session) updateSession(this._session, { user });
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	getUser() {
		return this._user;
	}
	/**
	* @inheritDoc
	*/
	getRequestSession() {
		return this._requestSession;
	}
	/**
	* @inheritDoc
	*/
	setRequestSession(requestSession) {
		this._requestSession = requestSession;
		return this;
	}
	/**
	* @inheritDoc
	*/
	setTags(tags) {
		this._tags = {
			...this._tags,
			...tags
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setTag(key, value) {
		this._tags = {
			...this._tags,
			[key]: value
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setExtras(extras) {
		this._extra = {
			...this._extra,
			...extras
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setExtra(key, extra) {
		this._extra = {
			...this._extra,
			[key]: extra
		};
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setFingerprint(fingerprint) {
		this._fingerprint = fingerprint;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setLevel(level) {
		this._level = level;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setTransactionName(name) {
		this._transactionName = name;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setContext(key, context) {
		if (context === null) delete this._contexts[key];
		else this._contexts[key] = context;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	setSession(session) {
		if (!session) delete this._session;
		else this._session = session;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	getSession() {
		return this._session;
	}
	/**
	* @inheritDoc
	*/
	update(captureContext) {
		if (!captureContext) return this;
		const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
		const [scopeInstance, requestSession] = scopeToMerge instanceof Scope ? [scopeToMerge.getScopeData(), scopeToMerge.getRequestSession()] : isPlainObject(scopeToMerge) ? [captureContext, captureContext.requestSession] : [];
		const { tags, extra, user, contexts, level, fingerprint = [], propagationContext } = scopeInstance || {};
		this._tags = {
			...this._tags,
			...tags
		};
		this._extra = {
			...this._extra,
			...extra
		};
		this._contexts = {
			...this._contexts,
			...contexts
		};
		if (user && Object.keys(user).length) this._user = user;
		if (level) this._level = level;
		if (fingerprint.length) this._fingerprint = fingerprint;
		if (propagationContext) this._propagationContext = propagationContext;
		if (requestSession) this._requestSession = requestSession;
		return this;
	}
	/**
	* @inheritDoc
	*/
	clear() {
		this._breadcrumbs = [];
		this._tags = {};
		this._extra = {};
		this._user = {};
		this._contexts = {};
		this._level = void 0;
		this._transactionName = void 0;
		this._fingerprint = void 0;
		this._requestSession = void 0;
		this._session = void 0;
		_setSpanForScope(this, void 0);
		this._attachments = [];
		this._propagationContext = generatePropagationContext();
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	addBreadcrumb(breadcrumb, maxBreadcrumbs) {
		const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
		if (maxCrumbs <= 0) return this;
		const mergedBreadcrumb = {
			timestamp: dateTimestampInSeconds(),
			...breadcrumb
		};
		const breadcrumbs = this._breadcrumbs;
		breadcrumbs.push(mergedBreadcrumb);
		this._breadcrumbs = breadcrumbs.length > maxCrumbs ? breadcrumbs.slice(-maxCrumbs) : breadcrumbs;
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	getLastBreadcrumb() {
		return this._breadcrumbs[this._breadcrumbs.length - 1];
	}
	/**
	* @inheritDoc
	*/
	clearBreadcrumbs() {
		this._breadcrumbs = [];
		this._notifyScopeListeners();
		return this;
	}
	/**
	* @inheritDoc
	*/
	addAttachment(attachment) {
		this._attachments.push(attachment);
		return this;
	}
	/**
	* @inheritDoc
	*/
	clearAttachments() {
		this._attachments = [];
		return this;
	}
	/** @inheritDoc */
	getScopeData() {
		return {
			breadcrumbs: this._breadcrumbs,
			attachments: this._attachments,
			contexts: this._contexts,
			tags: this._tags,
			extra: this._extra,
			user: this._user,
			level: this._level,
			fingerprint: this._fingerprint || [],
			eventProcessors: this._eventProcessors,
			propagationContext: this._propagationContext,
			sdkProcessingMetadata: this._sdkProcessingMetadata,
			transactionName: this._transactionName,
			span: _getSpanForScope(this)
		};
	}
	/**
	* @inheritDoc
	*/
	setSDKProcessingMetadata(newData) {
		this._sdkProcessingMetadata = {
			...this._sdkProcessingMetadata,
			...newData
		};
		return this;
	}
	/**
	* @inheritDoc
	*/
	setPropagationContext(context) {
		this._propagationContext = context;
		return this;
	}
	/**
	* @inheritDoc
	*/
	getPropagationContext() {
		return this._propagationContext;
	}
	/**
	* @inheritDoc
	*/
	captureException(exception, hint) {
		const eventId = hint && hint.event_id ? hint.event_id : uuid4();
		if (!this._client) {
			logger.warn("No client configured on scope - will not capture exception!");
			return eventId;
		}
		const syntheticException = /* @__PURE__ */ new Error("Sentry syntheticException");
		this._client.captureException(exception, {
			originalException: exception,
			syntheticException,
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* @inheritDoc
	*/
	captureMessage(message, level, hint) {
		const eventId = hint && hint.event_id ? hint.event_id : uuid4();
		if (!this._client) {
			logger.warn("No client configured on scope - will not capture message!");
			return eventId;
		}
		const syntheticException = new Error(message);
		this._client.captureMessage(message, level, {
			originalException: message,
			syntheticException,
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* @inheritDoc
	*/
	captureEvent(event, hint) {
		const eventId = hint && hint.event_id ? hint.event_id : uuid4();
		if (!this._client) {
			logger.warn("No client configured on scope - will not capture event!");
			return eventId;
		}
		this._client.captureEvent(event, {
			...hint,
			event_id: eventId
		}, this);
		return eventId;
	}
	/**
	* This will be called on every set call.
	*/
	_notifyScopeListeners() {
		if (!this._notifyingListeners) {
			this._notifyingListeners = true;
			this._scopeListeners.forEach((callback) => {
				callback(this);
			});
			this._notifyingListeners = false;
		}
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/defaultScopes.js
/** Get the default current scope. */
function getDefaultCurrentScope() {
	return getGlobalSingleton("defaultCurrentScope", () => new Scope());
}
/** Get the default isolation scope. */
function getDefaultIsolationScope() {
	return getGlobalSingleton("defaultIsolationScope", () => new Scope());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/asyncContext/stackStrategy.js
/**
* This is an object that holds a stack of scopes.
*/
var AsyncContextStack = class {
	constructor(scope, isolationScope) {
		let assignedScope;
		if (!scope) assignedScope = new Scope();
		else assignedScope = scope;
		let assignedIsolationScope;
		if (!isolationScope) assignedIsolationScope = new Scope();
		else assignedIsolationScope = isolationScope;
		this._stack = [{ scope: assignedScope }];
		this._isolationScope = assignedIsolationScope;
	}
	/**
	* Fork a scope for the stack.
	*/
	withScope(callback) {
		const scope = this._pushScope();
		let maybePromiseResult;
		try {
			maybePromiseResult = callback(scope);
		} catch (e) {
			this._popScope();
			throw e;
		}
		if (isThenable(maybePromiseResult)) return maybePromiseResult.then((res) => {
			this._popScope();
			return res;
		}, (e) => {
			this._popScope();
			throw e;
		});
		this._popScope();
		return maybePromiseResult;
	}
	/**
	* Get the client of the stack.
	*/
	getClient() {
		return this.getStackTop().client;
	}
	/**
	* Returns the scope of the top stack.
	*/
	getScope() {
		return this.getStackTop().scope;
	}
	/**
	* Get the isolation scope for the stack.
	*/
	getIsolationScope() {
		return this._isolationScope;
	}
	/**
	* Returns the topmost scope layer in the order domain > local > process.
	*/
	getStackTop() {
		return this._stack[this._stack.length - 1];
	}
	/**
	* Push a scope to the stack.
	*/
	_pushScope() {
		const scope = this.getScope().clone();
		this._stack.push({
			client: this.getClient(),
			scope
		});
		return scope;
	}
	/**
	* Pop a scope from the stack.
	*/
	_popScope() {
		if (this._stack.length <= 1) return false;
		return !!this._stack.pop();
	}
};
/**
* Get the global async context stack.
* This will be removed during the v8 cycle and is only here to make migration easier.
*/
function getAsyncContextStack() {
	const sentry = getSentryCarrier(getMainCarrier());
	return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
}
function withScope$1(callback) {
	return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope, callback) {
	const stack = getAsyncContextStack();
	return stack.withScope(() => {
		stack.getStackTop().scope = scope;
		return callback(scope);
	});
}
function withIsolationScope(callback) {
	return getAsyncContextStack().withScope(() => {
		return callback(getAsyncContextStack().getIsolationScope());
	});
}
/**
* Get the stack-based async context strategy.
*/
function getStackAsyncContextStrategy() {
	return {
		withIsolationScope,
		withScope: withScope$1,
		withSetScope,
		withSetIsolationScope: (_isolationScope, callback) => {
			return withIsolationScope(callback);
		},
		getCurrentScope: () => getAsyncContextStack().getScope(),
		getIsolationScope: () => getAsyncContextStack().getIsolationScope()
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/asyncContext/index.js
/**
* Get the current async context strategy.
* If none has been setup, the default will be used.
*/
function getAsyncContextStrategy(carrier) {
	const sentry = getSentryCarrier(carrier);
	if (sentry.acs) return sentry.acs;
	return getStackAsyncContextStrategy();
}
//#endregion
//#region node_modules/@sentry/core/build/esm/currentScopes.js
/**
* Get the currently active scope.
*/
function getCurrentScope() {
	return getAsyncContextStrategy(getMainCarrier()).getCurrentScope();
}
/**
* Get the currently active isolation scope.
* The isolation scope is active for the current exection context.
*/
function getIsolationScope() {
	return getAsyncContextStrategy(getMainCarrier()).getIsolationScope();
}
/**
* Get the global scope.
* This scope is applied to _all_ events.
*/
function getGlobalScope() {
	return getGlobalSingleton("globalScope", () => new Scope());
}
/**
* Creates a new scope with and executes the given operation within.
* The scope is automatically removed once the operation
* finishes or throws.
*/
/**
* Either creates a new active scope, or sets the given scope as active scope in the given callback.
*/
function withScope(...rest) {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (rest.length === 2) {
		const [scope, callback] = rest;
		if (!scope) return acs.withScope(callback);
		return acs.withSetScope(scope, callback);
	}
	return acs.withScope(rest[0]);
}
/**
* Get the currently active client.
*/
function getClient() {
	return getCurrentScope().getClient();
}
//#endregion
//#region node_modules/@sentry/core/build/esm/metrics/metric-summary.js
/**
* key: bucketKey
* value: [exportKey, MetricSummary]
*/
const METRICS_SPAN_FIELD = "_sentryMetrics";
/**
* Fetches the metric summary if it exists for the passed span
*/
function getMetricSummaryJsonForSpan(span) {
	const storage = span[METRICS_SPAN_FIELD];
	if (!storage) return;
	const output = {};
	for (const [, [exportKey, summary]] of storage) (output[exportKey] || (output[exportKey] = [])).push(dropUndefinedKeys(summary));
	return output;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/semanticAttributes.js
/**
* Use this attribute to represent the source of a span.
* Should be one of: custom, url, route, view, component, task, unknown
*
*/
const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
/**
* Use this attribute to represent the sample rate used for a span.
*/
const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
/**
* Use this attribute to represent the operation of a span.
*/
const SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
/**
* Use this attribute to represent the origin of a span.
*/
const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
/** The unit of a measurement, which may be stored as a TimedEvent. */
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
/** The value of a measurement, which may be stored as a TimedEvent. */
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
/**
* The id of the profile that this span occured in.
*/
const SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
/**
* Convert a span to a trace context, which can be sent as the `trace` context in an event.
* By default, this will only include trace_id, span_id & parent_span_id.
* If `includeAllData` is true, it will also include data, op, status & origin.
*/
function spanToTransactionTraceContext(span) {
	const { spanId: span_id, traceId: trace_id } = span.spanContext();
	const { data, op, parent_span_id, status, origin } = spanToJSON(span);
	return dropUndefinedKeys({
		parent_span_id,
		span_id,
		trace_id,
		data,
		op,
		status,
		origin
	});
}
/**
* Convert a span to a trace context, which can be sent as the `trace` context in a non-transaction event.
*/
function spanToTraceContext(span) {
	const { spanId: span_id, traceId: trace_id } = span.spanContext();
	const { parent_span_id } = spanToJSON(span);
	return dropUndefinedKeys({
		parent_span_id,
		span_id,
		trace_id
	});
}
/**
* Convert a Span to a Sentry trace header.
*/
function spanToTraceHeader(span) {
	const { traceId, spanId } = span.spanContext();
	return generateSentryTraceHeader(traceId, spanId, spanIsSampled(span));
}
/**
* Convert a span time input into a timestamp in seconds.
*/
function spanTimeInputToSeconds(input) {
	if (typeof input === "number") return ensureTimestampInSeconds(input);
	if (Array.isArray(input)) return input[0] + input[1] / 1e9;
	if (input instanceof Date) return ensureTimestampInSeconds(input.getTime());
	return timestampInSeconds();
}
/**
* Converts a timestamp to second, if it was in milliseconds, or keeps it as second.
*/
function ensureTimestampInSeconds(timestamp) {
	return timestamp > 9999999999 ? timestamp / 1e3 : timestamp;
}
/**
* Convert a span to a JSON representation.
*/
function spanToJSON(span) {
	if (spanIsSentrySpan(span)) return span.getSpanJSON();
	try {
		const { spanId: span_id, traceId: trace_id } = span.spanContext();
		if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
			const { attributes, startTime, name, endTime, parentSpanId, status } = span;
			return dropUndefinedKeys({
				span_id,
				trace_id,
				data: attributes,
				description: name,
				parent_span_id: parentSpanId,
				start_timestamp: spanTimeInputToSeconds(startTime),
				timestamp: spanTimeInputToSeconds(endTime) || void 0,
				status: getStatusMessage(status),
				op: attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
				origin: attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
				_metrics_summary: getMetricSummaryJsonForSpan(span)
			});
		}
		return {
			span_id,
			trace_id
		};
	} catch (e) {
		return {};
	}
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
	const castSpan = span;
	return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
/** Exported only for tests. */
/**
* Sadly, due to circular dependency checks we cannot actually import the Span class here and check for instanceof.
* :( So instead we approximate this by checking if it has the `getSpanJSON` method.
*/
function spanIsSentrySpan(span) {
	return typeof span.getSpanJSON === "function";
}
/**
* Returns true if a span is sampled.
* In most cases, you should just use `span.isRecording()` instead.
* However, this has a slightly different semantic, as it also returns false if the span is finished.
* So in the case where this distinction is important, use this method.
*/
function spanIsSampled(span) {
	const { traceFlags } = span.spanContext();
	return traceFlags === 1;
}
/** Get the status message to use for a JSON representation of a span. */
function getStatusMessage(status) {
	if (!status || status.code === 0) return;
	if (status.code === 1) return "ok";
	return status.message || "unknown_error";
}
const CHILD_SPANS_FIELD = "_sentryChildSpans";
const ROOT_SPAN_FIELD = "_sentryRootSpan";
/**
* Adds an opaque child span reference to a span.
*/
function addChildSpanToSpan(span, childSpan) {
	addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, span[ROOT_SPAN_FIELD] || span);
	if (span[CHILD_SPANS_FIELD]) span[CHILD_SPANS_FIELD].add(childSpan);
	else addNonEnumerableProperty(span, CHILD_SPANS_FIELD, new Set([childSpan]));
}
/**
* Returns an array of the given span and all of its descendants.
*/
function getSpanDescendants(span) {
	const resultSet = /* @__PURE__ */ new Set();
	function addSpanChildren(span) {
		if (resultSet.has(span)) return;
		else if (spanIsSampled(span)) {
			resultSet.add(span);
			const childSpans = span[CHILD_SPANS_FIELD] ? Array.from(span[CHILD_SPANS_FIELD]) : [];
			for (const childSpan of childSpans) addSpanChildren(childSpan);
		}
	}
	addSpanChildren(span);
	return Array.from(resultSet);
}
/**
* Returns the root span of a given span.
*/
function getRootSpan(span) {
	return span[ROOT_SPAN_FIELD] || span;
}
/**
* Returns the currently active span.
*/
function getActiveSpan() {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (acs.getActiveSpan) return acs.getActiveSpan();
	return _getSpanForScope(getCurrentScope());
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/errors.js
let errorsInstrumented = false;
/**
* Ensure that global errors automatically set the active span status.
*/
function registerSpanErrorInstrumentation() {
	if (errorsInstrumented) return;
	errorsInstrumented = true;
	addGlobalErrorInstrumentationHandler(errorCallback);
	addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
}
/**
* If an error or unhandled promise occurs, we mark the active root span as failed
*/
function errorCallback() {
	const activeSpan = getActiveSpan();
	const rootSpan = activeSpan && getRootSpan(activeSpan);
	if (rootSpan) {
		const message = "internal_error";
		DEBUG_BUILD && logger.log(`[Tracing] Root span: ${message} -> Global error occured`);
		rootSpan.setStatus({
			code: 2,
			message
		});
	}
}
errorCallback.tag = "sentry_tracingErrorCallback";
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/utils.js
const SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
const ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
/** Store the scope & isolation scope for a span, which can the be used when it is finished. */
function setCapturedScopesOnSpan(span, scope, isolationScope) {
	if (span) {
		addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, isolationScope);
		addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
	}
}
/**
* Grabs the scope and isolation scope off a span that were active when the span was started.
*/
function getCapturedScopesOnSpan(span) {
	return {
		scope: span[SCOPE_ON_START_SPAN_FIELD],
		isolationScope: span[ISOLATION_SCOPE_ON_START_SPAN_FIELD]
	};
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/hasTracingEnabled.js
/**
* Determines if tracing is currently enabled.
*
* Tracing is enabled when at least one of `tracesSampleRate` and `tracesSampler` is defined in the SDK config.
*/
function hasTracingEnabled(maybeOptions) {
	if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) return false;
	const client = getClient();
	const options = maybeOptions || client && client.getOptions();
	return !!options && (options.enableTracing || "tracesSampleRate" in options || "tracesSampler" in options);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sentryNonRecordingSpan.js
/**
* A Sentry Span that is non-recording, meaning it will not be sent to Sentry.
*/
var SentryNonRecordingSpan = class {
	constructor(spanContext = {}) {
		this._traceId = spanContext.traceId || uuid4();
		this._spanId = spanContext.spanId || uuid4().substring(16);
	}
	/** @inheritdoc */
	spanContext() {
		return {
			spanId: this._spanId,
			traceId: this._traceId,
			traceFlags: 0
		};
	}
	/** @inheritdoc */
	end(_timestamp) {}
	/** @inheritdoc */
	setAttribute(_key, _value) {
		return this;
	}
	/** @inheritdoc */
	setAttributes(_values) {
		return this;
	}
	/** @inheritdoc */
	setStatus(_status) {
		return this;
	}
	/** @inheritdoc */
	updateName(_name) {
		return this;
	}
	/** @inheritdoc */
	isRecording() {
		return false;
	}
	/** @inheritdoc */
	addEvent(_name, _attributesOrStartTime, _startTime) {
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for being comliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	addLink(_link) {
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for being comliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	addLinks(_links) {
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for being comliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	recordException(_exception, _time) {}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/handleCallbackErrors.js
/**
* Wrap a callback function with error handling.
* If an error is thrown, it will be passed to the `onError` callback and re-thrown.
*
* If the return value of the function is a promise, it will be handled with `maybeHandlePromiseRejection`.
*
* If an `onFinally` callback is provided, this will be called when the callback has finished
* - so if it returns a promise, once the promise resolved/rejected,
* else once the callback has finished executing.
* The `onFinally` callback will _always_ be called, no matter if an error was thrown or not.
*/
function handleCallbackErrors(fn, onError, onFinally = () => {}) {
	let maybePromiseResult;
	try {
		maybePromiseResult = fn();
	} catch (e) {
		onError(e);
		onFinally();
		throw e;
	}
	return maybeHandlePromiseRejection(maybePromiseResult, onError, onFinally);
}
/**
* Maybe handle a promise rejection.
* This expects to be given a value that _may_ be a promise, or any other value.
* If it is a promise, and it rejects, it will call the `onError` callback.
* Other than this, it will generally return the given value as-is.
*/
function maybeHandlePromiseRejection(value, onError, onFinally) {
	if (isThenable(value)) return value.then((res) => {
		onFinally();
		return res;
	}, (e) => {
		onError(e);
		onFinally();
		throw e;
	});
	onFinally();
	return value;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/constants.js
const DEFAULT_ENVIRONMENT = "production";
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/dynamicSamplingContext.js
/**
* If you change this value, also update the terser plugin config to
* avoid minification of the object property!
*/
const FROZEN_DSC_FIELD = "_frozenDsc";
/**
* Freeze the given DSC on the given span.
*/
function freezeDscOnSpan(span, dsc) {
	addNonEnumerableProperty(span, FROZEN_DSC_FIELD, dsc);
}
/**
* Creates a dynamic sampling context from a client.
*
* Dispatches the `createDsc` lifecycle hook as a side effect.
*/
function getDynamicSamplingContextFromClient(trace_id, client) {
	const options = client.getOptions();
	const { publicKey: public_key } = client.getDsn() || {};
	const dsc = dropUndefinedKeys({
		environment: options.environment || "production",
		release: options.release,
		public_key,
		trace_id
	});
	client.emit("createDsc", dsc);
	return dsc;
}
/**
* Creates a dynamic sampling context from a span (and client and scope)
*
* @param span the span from which a few values like the root span name and sample rate are extracted.
*
* @returns a dynamic sampling context
*/
function getDynamicSamplingContextFromSpan(span) {
	const client = getClient();
	if (!client) return {};
	const dsc = getDynamicSamplingContextFromClient(spanToJSON(span).trace_id || "", client);
	const rootSpan = getRootSpan(span);
	const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
	if (frozenDsc) return frozenDsc;
	const traceState = rootSpan.spanContext().traceState;
	const traceStateDsc = traceState && traceState.get("sentry.dsc");
	const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
	if (dscOnTraceState) return dscOnTraceState;
	const jsonSpan = spanToJSON(rootSpan);
	const attributes = jsonSpan.data || {};
	const maybeSampleRate = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
	if (maybeSampleRate != null) dsc.sample_rate = `${maybeSampleRate}`;
	const source = attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
	const name = jsonSpan.description;
	if (source !== "url" && name) dsc.transaction = name;
	dsc.sampled = String(spanIsSampled(rootSpan));
	client.emit("createDsc", dsc, rootSpan);
	return dsc;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/logSpans.js
/**
* Print a log message for a started span.
*/
function logSpanStart(span) {
	if (!DEBUG_BUILD) return;
	const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToJSON(span);
	const { spanId } = span.spanContext();
	const sampled = spanIsSampled(span);
	const rootSpan = getRootSpan(span);
	const isRootSpan = rootSpan === span;
	const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
	const infoParts = [
		`op: ${op}`,
		`name: ${description}`,
		`ID: ${spanId}`
	];
	if (parentSpanId) infoParts.push(`parent ID: ${parentSpanId}`);
	if (!isRootSpan) {
		const { op, description } = spanToJSON(rootSpan);
		infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
		if (op) infoParts.push(`root op: ${op}`);
		if (description) infoParts.push(`root description: ${description}`);
	}
	logger.log(`${header}
  ${infoParts.join("\n  ")}`);
}
/**
* Print a log message for an ended span.
*/
function logSpanEnd(span) {
	if (!DEBUG_BUILD) return;
	const { description = "< unknown name >", op = "< unknown op >" } = spanToJSON(span);
	const { spanId } = span.spanContext();
	const msg = `[Tracing] Finishing "${op}" ${getRootSpan(span) === span ? "root " : ""}span "${description}" with ID ${spanId}`;
	logger.log(msg);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/parseSampleRate.js
/**
* Parse a sample rate from a given value.
* This will either return a boolean or number sample rate, if the sample rate is valid (between 0 and 1).
* If a string is passed, we try to convert it to a number.
*
* Any invalid sample rate will return `undefined`.
*/
function parseSampleRate(sampleRate) {
	if (typeof sampleRate === "boolean") return Number(sampleRate);
	const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
	if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
		DEBUG_BUILD && logger.warn(`[Tracing] Given sample rate is invalid. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(sampleRate)} of type ${JSON.stringify(typeof sampleRate)}.`);
		return;
	}
	return rate;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sampling.js
/**
* Makes a sampling decision for the given options.
*
* Called every time a root span is created. Only root spans which emerge with a `sampled` value of `true` will be
* sent to Sentry.
*/
function sampleSpan(options, samplingContext) {
	if (!hasTracingEnabled(options)) return [false];
	let sampleRate;
	if (typeof options.tracesSampler === "function") sampleRate = options.tracesSampler(samplingContext);
	else if (samplingContext.parentSampled !== void 0) sampleRate = samplingContext.parentSampled;
	else if (typeof options.tracesSampleRate !== "undefined") sampleRate = options.tracesSampleRate;
	else sampleRate = 1;
	const parsedSampleRate = parseSampleRate(sampleRate);
	if (parsedSampleRate === void 0) {
		DEBUG_BUILD && logger.warn("[Tracing] Discarding transaction because of invalid sample rate.");
		return [false];
	}
	if (!parsedSampleRate) {
		DEBUG_BUILD && logger.log(`[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`);
		return [false, parsedSampleRate];
	}
	if (!(Math.random() < parsedSampleRate)) {
		DEBUG_BUILD && logger.log(`[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(sampleRate)})`);
		return [false, parsedSampleRate];
	}
	return [true, parsedSampleRate];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/envelope.js
/**
* Apply SdkInfo (name, version, packages, integrations) to the corresponding event key.
* Merge with existing data if any.
**/
function enhanceEventWithSdkInfo(event, sdkInfo) {
	if (!sdkInfo) return event;
	event.sdk = event.sdk || {};
	event.sdk.name = event.sdk.name || sdkInfo.name;
	event.sdk.version = event.sdk.version || sdkInfo.version;
	event.sdk.integrations = [...event.sdk.integrations || [], ...sdkInfo.integrations || []];
	event.sdk.packages = [...event.sdk.packages || [], ...sdkInfo.packages || []];
	return event;
}
/** Creates an envelope from a Session */
function createSessionEnvelope(session, dsn, metadata, tunnel) {
	const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
	return createEnvelope({
		sent_at: (/* @__PURE__ */ new Date()).toISOString(),
		...sdkInfo && { sdk: sdkInfo },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) }
	}, ["aggregates" in session ? [{ type: "sessions" }, session] : [{ type: "session" }, session.toJSON()]]);
}
/**
* Create an Envelope from an event.
*/
function createEventEnvelope(event, dsn, metadata, tunnel) {
	const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
	const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
	enhanceEventWithSdkInfo(event, metadata && metadata.sdk);
	const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
	delete event.sdkProcessingMetadata;
	return createEnvelope(envelopeHeaders, [[{ type: eventType }, event]]);
}
/**
* Create envelope from Span item.
*
* Takes an optional client and runs spans through `beforeSendSpan` if available.
*/
function createSpanEnvelope(spans, client) {
	function dscHasRequiredProps(dsc) {
		return !!dsc.trace_id && !!dsc.public_key;
	}
	const dsc = getDynamicSamplingContextFromSpan(spans[0]);
	const dsn = client && client.getDsn();
	const tunnel = client && client.getOptions().tunnel;
	const headers = {
		sent_at: (/* @__PURE__ */ new Date()).toISOString(),
		...dscHasRequiredProps(dsc) && { trace: dsc },
		...!!tunnel && dsn && { dsn: dsnToString(dsn) }
	};
	const beforeSendSpan = client && client.getOptions().beforeSendSpan;
	const convertToSpanJSON = beforeSendSpan ? (span) => beforeSendSpan(spanToJSON(span)) : (span) => spanToJSON(span);
	const items = [];
	for (const span of spans) {
		const spanJson = convertToSpanJSON(span);
		if (spanJson) items.push(createSpanEnvelopeItem(spanJson));
	}
	return createEnvelope(headers, items);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/measurement.js
/**
* Adds a measurement to the active transaction on the current global scope. You can optionally pass in a different span
* as the 4th parameter.
*/
function setMeasurement(name, value, unit, activeSpan = getActiveSpan()) {
	const rootSpan = activeSpan && getRootSpan(activeSpan);
	if (rootSpan) rootSpan.addEvent(name, {
		[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE]: value,
		[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT]: unit
	});
}
/**
* Convert timed events to measurements.
*/
function timedEventsToMeasurements(events) {
	if (!events || events.length === 0) return;
	const measurements = {};
	events.forEach((event) => {
		const attributes = event.attributes || {};
		const unit = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
		const value = attributes[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
		if (typeof unit === "string" && typeof value === "number") measurements[event.name] = {
			value,
			unit
		};
	});
	return measurements;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/sentrySpan.js
const MAX_SPAN_COUNT = 1e3;
/**
* Span contains all data about a span
*/
var SentrySpan = class {
	/** Epoch timestamp in seconds when the span started. */
	/** Epoch timestamp in seconds when the span ended. */
	/** Internal keeper of the status */
	/** The timed events added to this span. */
	/** if true, treat span as a standalone span (not part of a transaction) */
	/**
	* You should never call the constructor manually, always use `Sentry.startSpan()`
	* or other span methods.
	* @internal
	* @hideconstructor
	* @hidden
	*/
	constructor(spanContext = {}) {
		this._traceId = spanContext.traceId || uuid4();
		this._spanId = spanContext.spanId || uuid4().substring(16);
		this._startTime = spanContext.startTimestamp || timestampInSeconds();
		this._attributes = {};
		this.setAttributes({
			[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
			[SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
			...spanContext.attributes
		});
		this._name = spanContext.name;
		if (spanContext.parentSpanId) this._parentSpanId = spanContext.parentSpanId;
		if ("sampled" in spanContext) this._sampled = spanContext.sampled;
		if (spanContext.endTimestamp) this._endTime = spanContext.endTimestamp;
		this._events = [];
		this._isStandaloneSpan = spanContext.isStandalone;
		if (this._endTime) this._onSpanEnded();
	}
	/**
	* This should generally not be used,
	* but it is needed for being compliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	addLink(_link) {
		return this;
	}
	/**
	* This should generally not be used,
	* but it is needed for being compliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	addLinks(_links) {
		return this;
	}
	/**
	* This should generally not be used,
	* but it is needed for being compliant with the OTEL Span interface.
	*
	* @hidden
	* @internal
	*/
	recordException(_exception, _time) {}
	/** @inheritdoc */
	spanContext() {
		const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
		return {
			spanId,
			traceId,
			traceFlags: sampled ? 1 : 0
		};
	}
	/** @inheritdoc */
	setAttribute(key, value) {
		if (value === void 0) delete this._attributes[key];
		else this._attributes[key] = value;
		return this;
	}
	/** @inheritdoc */
	setAttributes(attributes) {
		Object.keys(attributes).forEach((key) => this.setAttribute(key, attributes[key]));
		return this;
	}
	/**
	* This should generally not be used,
	* but we need it for browser tracing where we want to adjust the start time afterwards.
	* USE THIS WITH CAUTION!
	*
	* @hidden
	* @internal
	*/
	updateStartTime(timeInput) {
		this._startTime = spanTimeInputToSeconds(timeInput);
	}
	/**
	* @inheritDoc
	*/
	setStatus(value) {
		this._status = value;
		return this;
	}
	/**
	* @inheritDoc
	*/
	updateName(name) {
		this._name = name;
		return this;
	}
	/** @inheritdoc */
	end(endTimestamp) {
		if (this._endTime) return;
		this._endTime = spanTimeInputToSeconds(endTimestamp);
		logSpanEnd(this);
		this._onSpanEnded();
	}
	/**
	* Get JSON representation of this span.
	*
	* @hidden
	* @internal This method is purely for internal purposes and should not be used outside
	* of SDK code. If you need to get a JSON representation of a span,
	* use `spanToJSON(span)` instead.
	*/
	getSpanJSON() {
		return dropUndefinedKeys({
			data: this._attributes,
			description: this._name,
			op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
			parent_span_id: this._parentSpanId,
			span_id: this._spanId,
			start_timestamp: this._startTime,
			status: getStatusMessage(this._status),
			timestamp: this._endTime,
			trace_id: this._traceId,
			origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
			_metrics_summary: getMetricSummaryJsonForSpan(this),
			profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
			exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
			measurements: timedEventsToMeasurements(this._events),
			is_segment: this._isStandaloneSpan && getRootSpan(this) === this || void 0,
			segment_id: this._isStandaloneSpan ? getRootSpan(this).spanContext().spanId : void 0
		});
	}
	/** @inheritdoc */
	isRecording() {
		return !this._endTime && !!this._sampled;
	}
	/**
	* @inheritdoc
	*/
	addEvent(name, attributesOrStartTime, startTime) {
		DEBUG_BUILD && logger.log("[Tracing] Adding an event to span:", name);
		const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
		const attributes = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
		const event = {
			name,
			time: spanTimeInputToSeconds(time),
			attributes
		};
		this._events.push(event);
		return this;
	}
	/**
	* This method should generally not be used,
	* but for now we need a way to publicly check if the `_isStandaloneSpan` flag is set.
	* USE THIS WITH CAUTION!
	* @internal
	* @hidden
	* @experimental
	*/
	isStandaloneSpan() {
		return !!this._isStandaloneSpan;
	}
	/** Emit `spanEnd` when the span is ended. */
	_onSpanEnded() {
		const client = getClient();
		if (client) client.emit("spanEnd", this);
		if (!(this._isStandaloneSpan || this === getRootSpan(this))) return;
		if (this._isStandaloneSpan) {
			if (this._sampled) sendSpanEnvelope(createSpanEnvelope([this], client));
			else {
				DEBUG_BUILD && logger.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
				if (client) client.recordDroppedEvent("sample_rate", "span");
			}
			return;
		}
		const transactionEvent = this._convertSpanToTransaction();
		if (transactionEvent) (getCapturedScopesOnSpan(this).scope || getCurrentScope()).captureEvent(transactionEvent);
	}
	/**
	* Finish the transaction & prepare the event to send to Sentry.
	*/
	_convertSpanToTransaction() {
		if (!isFullFinishedSpan(spanToJSON(this))) return;
		if (!this._name) {
			DEBUG_BUILD && logger.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
			this._name = "<unlabeled transaction>";
		}
		const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
		const client = (capturedSpanScope || getCurrentScope()).getClient() || getClient();
		if (this._sampled !== true) {
			DEBUG_BUILD && logger.log("[Tracing] Discarding transaction because its trace was not chosen to be sampled.");
			if (client) client.recordDroppedEvent("sample_rate", "transaction");
			return;
		}
		const spans = getSpanDescendants(this).filter((span) => span !== this && !isStandaloneSpan(span)).map((span) => spanToJSON(span)).filter(isFullFinishedSpan);
		const source = this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
		const transaction = {
			contexts: { trace: spanToTransactionTraceContext(this) },
			spans: spans.length > MAX_SPAN_COUNT ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans,
			start_timestamp: this._startTime,
			timestamp: this._endTime,
			transaction: this._name,
			type: "transaction",
			sdkProcessingMetadata: {
				capturedSpanScope,
				capturedSpanIsolationScope,
				...dropUndefinedKeys({ dynamicSamplingContext: getDynamicSamplingContextFromSpan(this) })
			},
			_metrics_summary: getMetricSummaryJsonForSpan(this),
			...source && { transaction_info: { source } }
		};
		const measurements = timedEventsToMeasurements(this._events);
		if (measurements && Object.keys(measurements).length) {
			DEBUG_BUILD && logger.log("[Measurements] Adding measurements to transaction event", JSON.stringify(measurements, void 0, 2));
			transaction.measurements = measurements;
		}
		return transaction;
	}
};
function isSpanTimeInput(value) {
	return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
}
function isFullFinishedSpan(input) {
	return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
}
/** `SentrySpan`s can be sent as a standalone span rather than belonging to a transaction */
function isStandaloneSpan(span) {
	return span instanceof SentrySpan && span.isStandaloneSpan();
}
/**
* Sends a `SpanEnvelope`.
*
* Note: If the envelope's spans are dropped, e.g. via `beforeSendSpan`,
* the envelope will not be sent either.
*/
function sendSpanEnvelope(envelope) {
	const client = getClient();
	if (!client) return;
	const spanItems = envelope[1];
	if (!spanItems || spanItems.length === 0) {
		client.recordDroppedEvent("before_send", "span");
		return;
	}
	const transport = client.getTransport();
	if (transport) transport.send(envelope).then(null, (reason) => {
		DEBUG_BUILD && logger.error("Error while sending span:", reason);
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/tracing/trace.js
const SUPPRESS_TRACING_KEY = "__SENTRY_SUPPRESS_TRACING__";
/**
* Wraps a function with a transaction/span and finishes the span after the function is done.
* The created span is the active span and will be used as parent by other spans created inside the function
* and can be accessed via `Sentry.getActiveSpan()`, as long as the function is executed while the scope is active.
*
* If you want to create a span that is not set as active, use {@link startInactiveSpan}.
*
* You'll always get a span passed to the callback,
* it may just be a non-recording span if the span is not sampled or if tracing is disabled.
*/
function startSpan(options, callback) {
	const acs = getAcs();
	if (acs.startSpan) return acs.startSpan(options, callback);
	const spanArguments = parseSentrySpanArguments(options);
	const { forceTransaction, parentSpan: customParentSpan } = options;
	return withScope(options.scope, () => {
		return getActiveSpanWrapper(customParentSpan)(() => {
			const scope = getCurrentScope();
			const parentSpan = getParentSpan(scope);
			const activeSpan = options.onlyIfParent && !parentSpan ? new SentryNonRecordingSpan() : createChildOrRootSpan({
				parentSpan,
				spanArguments,
				forceTransaction,
				scope
			});
			_setSpanForScope(scope, activeSpan);
			return handleCallbackErrors(() => callback(activeSpan), () => {
				const { status } = spanToJSON(activeSpan);
				if (activeSpan.isRecording() && (!status || status === "ok")) activeSpan.setStatus({
					code: 2,
					message: "internal_error"
				});
			}, () => activeSpan.end());
		});
	});
}
/**
* Forks the current scope and sets the provided span as active span in the context of the provided callback. Can be
* passed `null` to start an entirely new span tree.
*
* @param span Spans started in the context of the provided callback will be children of this span. If `null` is passed,
* spans started within the callback will not be attached to a parent span.
* @param callback Execution context in which the provided span will be active. Is passed the newly forked scope.
* @returns the value returned from the provided callback function.
*/
function withActiveSpan(span, callback) {
	const acs = getAcs();
	if (acs.withActiveSpan) return acs.withActiveSpan(span, callback);
	return withScope((scope) => {
		_setSpanForScope(scope, span || void 0);
		return callback(scope);
	});
}
/** Suppress tracing in the given callback, ensuring no spans are generated inside of it. */
function suppressTracing(callback) {
	const acs = getAcs();
	if (acs.suppressTracing) return acs.suppressTracing(callback);
	return withScope((scope) => {
		scope.setSDKProcessingMetadata({ [SUPPRESS_TRACING_KEY]: true });
		return callback();
	});
}
function createChildOrRootSpan({ parentSpan, spanArguments, forceTransaction, scope }) {
	if (!hasTracingEnabled()) return new SentryNonRecordingSpan();
	const isolationScope = getIsolationScope();
	let span;
	if (parentSpan && !forceTransaction) {
		span = _startChildSpan(parentSpan, scope, spanArguments);
		addChildSpanToSpan(parentSpan, span);
	} else if (parentSpan) {
		const dsc = getDynamicSamplingContextFromSpan(parentSpan);
		const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
		const parentSampled = spanIsSampled(parentSpan);
		span = _startRootSpan({
			traceId,
			parentSpanId,
			...spanArguments
		}, scope, parentSampled);
		freezeDscOnSpan(span, dsc);
	} else {
		const { traceId, dsc, parentSpanId, sampled: parentSampled } = {
			...isolationScope.getPropagationContext(),
			...scope.getPropagationContext()
		};
		span = _startRootSpan({
			traceId,
			parentSpanId,
			...spanArguments
		}, scope, parentSampled);
		if (dsc) freezeDscOnSpan(span, dsc);
	}
	logSpanStart(span);
	setCapturedScopesOnSpan(span, scope, isolationScope);
	return span;
}
/**
* This converts StartSpanOptions to SentrySpanArguments.
* For the most part (for now) we accept the same options,
* but some of them need to be transformed.
*/
function parseSentrySpanArguments(options) {
	const initialCtx = {
		isStandalone: (options.experimental || {}).standalone,
		...options
	};
	if (options.startTime) {
		const ctx = { ...initialCtx };
		ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
		delete ctx.startTime;
		return ctx;
	}
	return initialCtx;
}
function getAcs() {
	return getAsyncContextStrategy(getMainCarrier());
}
function _startRootSpan(spanArguments, scope, parentSampled) {
	const client = getClient();
	const options = client && client.getOptions() || {};
	const { name = "", attributes } = spanArguments;
	const [sampled, sampleRate] = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] ? [false] : sampleSpan(options, {
		name,
		parentSampled,
		attributes,
		transactionContext: {
			name,
			parentSampled
		}
	});
	const rootSpan = new SentrySpan({
		...spanArguments,
		attributes: {
			[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "custom",
			...spanArguments.attributes
		},
		sampled
	});
	if (sampleRate !== void 0) rootSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE, sampleRate);
	if (client) client.emit("spanStart", rootSpan);
	return rootSpan;
}
/**
* Creates a new `Span` while setting the current `Span.id` as `parentSpanId`.
* This inherits the sampling decision from the parent span.
*/
function _startChildSpan(parentSpan, scope, spanArguments) {
	const { spanId, traceId } = parentSpan.spanContext();
	const sampled = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] ? false : spanIsSampled(parentSpan);
	const childSpan = sampled ? new SentrySpan({
		...spanArguments,
		parentSpanId: spanId,
		traceId,
		sampled
	}) : new SentryNonRecordingSpan({ traceId });
	addChildSpanToSpan(parentSpan, childSpan);
	const client = getClient();
	if (client) {
		client.emit("spanStart", childSpan);
		if (spanArguments.endTimestamp) client.emit("spanEnd", childSpan);
	}
	return childSpan;
}
function getParentSpan(scope) {
	const span = _getSpanForScope(scope);
	if (!span) return;
	const client = getClient();
	if ((client ? client.getOptions() : {}).parentSpanIsAlwaysRootSpan) return getRootSpan(span);
	return span;
}
function getActiveSpanWrapper(parentSpan) {
	return parentSpan !== void 0 ? (callback) => {
		return withActiveSpan(parentSpan, callback);
	} : (callback) => callback();
}
//#endregion
//#region node_modules/@sentry/core/build/esm/eventProcessors.js
/**
* Process an array of event processors, returning the processed event (or `null` if the event was dropped).
*/
function notifyEventProcessors(processors, event, hint, index = 0) {
	return new SyncPromise((resolve, reject) => {
		const processor = processors[index];
		if (event === null || typeof processor !== "function") resolve(event);
		else {
			const result = processor({ ...event }, hint);
			DEBUG_BUILD && processor.id && result === null && logger.log(`Event processor "${processor.id}" dropped event`);
			if (isThenable(result)) result.then((final) => notifyEventProcessors(processors, final, hint, index + 1).then(resolve)).then(null, reject);
			else notifyEventProcessors(processors, result, hint, index + 1).then(resolve).then(null, reject);
		}
	});
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/applyScopeDataToEvent.js
/**
* Applies data from the scope to the event and runs all event processors on it.
*/
function applyScopeDataToEvent(event, data) {
	const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
	applyDataToEvent(event, data);
	if (span) applySpanToEvent(event, span);
	applyFingerprintToEvent(event, fingerprint);
	applyBreadcrumbsToEvent(event, breadcrumbs);
	applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
/** Merge data of two scopes together. */
function mergeScopeData(data, mergeData) {
	const { extra, tags, user, contexts, level, sdkProcessingMetadata, breadcrumbs, fingerprint, eventProcessors, attachments, propagationContext, transactionName, span } = mergeData;
	mergeAndOverwriteScopeData(data, "extra", extra);
	mergeAndOverwriteScopeData(data, "tags", tags);
	mergeAndOverwriteScopeData(data, "user", user);
	mergeAndOverwriteScopeData(data, "contexts", contexts);
	mergeAndOverwriteScopeData(data, "sdkProcessingMetadata", sdkProcessingMetadata);
	if (level) data.level = level;
	if (transactionName) data.transactionName = transactionName;
	if (span) data.span = span;
	if (breadcrumbs.length) data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
	if (fingerprint.length) data.fingerprint = [...data.fingerprint, ...fingerprint];
	if (eventProcessors.length) data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
	if (attachments.length) data.attachments = [...data.attachments, ...attachments];
	data.propagationContext = {
		...data.propagationContext,
		...propagationContext
	};
}
/**
* Merges certain scope data. Undefined values will overwrite any existing values.
* Exported only for tests.
*/
function mergeAndOverwriteScopeData(data, prop, mergeVal) {
	if (mergeVal && Object.keys(mergeVal).length) {
		data[prop] = { ...data[prop] };
		for (const key in mergeVal) if (Object.prototype.hasOwnProperty.call(mergeVal, key)) data[prop][key] = mergeVal[key];
	}
}
function applyDataToEvent(event, data) {
	const { extra, tags, user, contexts, level, transactionName } = data;
	const cleanedExtra = dropUndefinedKeys(extra);
	if (cleanedExtra && Object.keys(cleanedExtra).length) event.extra = {
		...cleanedExtra,
		...event.extra
	};
	const cleanedTags = dropUndefinedKeys(tags);
	if (cleanedTags && Object.keys(cleanedTags).length) event.tags = {
		...cleanedTags,
		...event.tags
	};
	const cleanedUser = dropUndefinedKeys(user);
	if (cleanedUser && Object.keys(cleanedUser).length) event.user = {
		...cleanedUser,
		...event.user
	};
	const cleanedContexts = dropUndefinedKeys(contexts);
	if (cleanedContexts && Object.keys(cleanedContexts).length) event.contexts = {
		...cleanedContexts,
		...event.contexts
	};
	if (level) event.level = level;
	if (transactionName && event.type !== "transaction") event.transaction = transactionName;
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
	const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
	event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
	event.sdkProcessingMetadata = {
		...event.sdkProcessingMetadata,
		...sdkProcessingMetadata
	};
}
function applySpanToEvent(event, span) {
	event.contexts = {
		trace: spanToTraceContext(span),
		...event.contexts
	};
	event.sdkProcessingMetadata = {
		dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
		...event.sdkProcessingMetadata
	};
	const transactionName = spanToJSON(getRootSpan(span)).description;
	if (transactionName && !event.transaction && event.type === "transaction") event.transaction = transactionName;
}
/**
* Applies fingerprint from the scope to the event if there's one,
* uses message if there's one instead or get rid of empty fingerprint
*/
function applyFingerprintToEvent(event, fingerprint) {
	event.fingerprint = event.fingerprint ? arrayify$1(event.fingerprint) : [];
	if (fingerprint) event.fingerprint = event.fingerprint.concat(fingerprint);
	if (event.fingerprint && !event.fingerprint.length) delete event.fingerprint;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/prepareEvent.js
/**
* This type makes sure that we get either a CaptureContext, OR an EventHint.
* It does not allow mixing them, which could lead to unexpected outcomes, e.g. this is disallowed:
* { user: { id: '123' }, mechanism: { handled: false } }
*/
/**
* Adds common information to events.
*
* The information includes release and environment from `options`,
* breadcrumbs and context (extra, tags and user) from the scope.
*
* Information that is already present in the event is never overwritten. For
* nested objects, such as the context, keys are merged.
*
* @param event The original event.
* @param hint May contain additional information about the original exception.
* @param scope A scope containing event metadata.
* @returns A new event with more information.
* @hidden
*/
function prepareEvent(options, event, hint, scope, client, isolationScope) {
	const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
	const prepared = {
		...event,
		event_id: event.event_id || hint.event_id || uuid4(),
		timestamp: event.timestamp || dateTimestampInSeconds()
	};
	const integrations = hint.integrations || options.integrations.map((i) => i.name);
	applyClientOptions(prepared, options);
	applyIntegrationsMetadata(prepared, integrations);
	if (client) client.emit("applyFrameMetadata", event);
	if (event.type === void 0) applyDebugIds(prepared, options.stackParser);
	const finalScope = getFinalScope(scope, hint.captureContext);
	if (hint.mechanism) addExceptionMechanism(prepared, hint.mechanism);
	const clientEventProcessors = client ? client.getEventProcessors() : [];
	const data = getGlobalScope().getScopeData();
	if (isolationScope) mergeScopeData(data, isolationScope.getScopeData());
	if (finalScope) mergeScopeData(data, finalScope.getScopeData());
	const attachments = [...hint.attachments || [], ...data.attachments];
	if (attachments.length) hint.attachments = attachments;
	applyScopeDataToEvent(prepared, data);
	return notifyEventProcessors([...clientEventProcessors, ...data.eventProcessors], prepared, hint).then((evt) => {
		if (evt) applyDebugMeta(evt);
		if (typeof normalizeDepth === "number" && normalizeDepth > 0) return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
		return evt;
	});
}
/**
*  Enhances event using the client configuration.
*  It takes care of all "static" values like environment, release and `dist`,
*  as well as truncating overly long values.
* @param event event instance to be enhanced
*/
function applyClientOptions(event, options) {
	const { environment, release, dist, maxValueLength = 250 } = options;
	if (!("environment" in event)) event.environment = "environment" in options ? environment : DEFAULT_ENVIRONMENT;
	if (event.release === void 0 && release !== void 0) event.release = release;
	if (event.dist === void 0 && dist !== void 0) event.dist = dist;
	if (event.message) event.message = truncate(event.message, maxValueLength);
	const exception = event.exception && event.exception.values && event.exception.values[0];
	if (exception && exception.value) exception.value = truncate(exception.value, maxValueLength);
	const request = event.request;
	if (request && request.url) request.url = truncate(request.url, maxValueLength);
}
const debugIdStackParserCache = /* @__PURE__ */ new WeakMap();
/**
* Puts debug IDs into the stack frames of an error event.
*/
function applyDebugIds(event, stackParser) {
	const debugIdMap = GLOBAL_OBJ._sentryDebugIds;
	if (!debugIdMap) return;
	let debugIdStackFramesCache;
	const cachedDebugIdStackFrameCache = debugIdStackParserCache.get(stackParser);
	if (cachedDebugIdStackFrameCache) debugIdStackFramesCache = cachedDebugIdStackFrameCache;
	else {
		debugIdStackFramesCache = /* @__PURE__ */ new Map();
		debugIdStackParserCache.set(stackParser, debugIdStackFramesCache);
	}
	const filenameDebugIdMap = Object.entries(debugIdMap).reduce((acc, [debugIdStackTrace, debugIdValue]) => {
		let parsedStack;
		const cachedParsedStack = debugIdStackFramesCache.get(debugIdStackTrace);
		if (cachedParsedStack) parsedStack = cachedParsedStack;
		else {
			parsedStack = stackParser(debugIdStackTrace);
			debugIdStackFramesCache.set(debugIdStackTrace, parsedStack);
		}
		for (let i = parsedStack.length - 1; i >= 0; i--) {
			const stackFrame = parsedStack[i];
			if (stackFrame.filename) {
				acc[stackFrame.filename] = debugIdValue;
				break;
			}
		}
		return acc;
	}, {});
	try {
		event.exception.values.forEach((exception) => {
			exception.stacktrace.frames.forEach((frame) => {
				if (frame.filename) frame.debug_id = filenameDebugIdMap[frame.filename];
			});
		});
	} catch (e) {}
}
/**
* Moves debug IDs from the stack frames of an error event into the debug_meta field.
*/
function applyDebugMeta(event) {
	const filenameDebugIdMap = {};
	try {
		event.exception.values.forEach((exception) => {
			exception.stacktrace.frames.forEach((frame) => {
				if (frame.debug_id) {
					if (frame.abs_path) filenameDebugIdMap[frame.abs_path] = frame.debug_id;
					else if (frame.filename) filenameDebugIdMap[frame.filename] = frame.debug_id;
					delete frame.debug_id;
				}
			});
		});
	} catch (e) {}
	if (Object.keys(filenameDebugIdMap).length === 0) return;
	event.debug_meta = event.debug_meta || {};
	event.debug_meta.images = event.debug_meta.images || [];
	const images = event.debug_meta.images;
	Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
		images.push({
			type: "sourcemap",
			code_file: filename,
			debug_id
		});
	});
}
/**
* This function adds all used integrations to the SDK info in the event.
* @param event The event that will be filled with all integrations.
*/
function applyIntegrationsMetadata(event, integrationNames) {
	if (integrationNames.length > 0) {
		event.sdk = event.sdk || {};
		event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
	}
}
/**
* Applies `normalize` function on necessary `Event` attributes to make them safe for serialization.
* Normalized keys:
* - `breadcrumbs.data`
* - `user`
* - `contexts`
* - `extra`
* @param event Event
* @returns Normalized event
*/
function normalizeEvent(event, depth, maxBreadth) {
	if (!event) return null;
	const normalized = {
		...event,
		...event.breadcrumbs && { breadcrumbs: event.breadcrumbs.map((b) => ({
			...b,
			...b.data && { data: normalize(b.data, depth, maxBreadth) }
		})) },
		...event.user && { user: normalize(event.user, depth, maxBreadth) },
		...event.contexts && { contexts: normalize(event.contexts, depth, maxBreadth) },
		...event.extra && { extra: normalize(event.extra, depth, maxBreadth) }
	};
	if (event.contexts && event.contexts.trace && normalized.contexts) {
		normalized.contexts.trace = event.contexts.trace;
		if (event.contexts.trace.data) normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
	}
	if (event.spans) normalized.spans = event.spans.map((span) => {
		return {
			...span,
			...span.data && { data: normalize(span.data, depth, maxBreadth) }
		};
	});
	return normalized;
}
function getFinalScope(scope, captureContext) {
	if (!captureContext) return scope;
	const finalScope = scope ? scope.clone() : new Scope();
	finalScope.update(captureContext);
	return finalScope;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/sessionflusher.js
/**
* @inheritdoc
*/
var SessionFlusher = class {
	constructor(client, attrs) {
		this._client = client;
		this.flushTimeout = 60;
		this._pendingAggregates = /* @__PURE__ */ new Map();
		this._isEnabled = true;
		this._intervalId = setInterval(() => this.flush(), this.flushTimeout * 1e3);
		if (this._intervalId.unref) this._intervalId.unref();
		this._sessionAttrs = attrs;
	}
	/** Checks if `pendingAggregates` has entries, and if it does flushes them by calling `sendSession` */
	flush() {
		const sessionAggregates = this.getSessionAggregates();
		if (sessionAggregates.aggregates.length === 0) return;
		this._pendingAggregates = /* @__PURE__ */ new Map();
		this._client.sendSession(sessionAggregates);
	}
	/** Massages the entries in `pendingAggregates` and returns aggregated sessions */
	getSessionAggregates() {
		const aggregates = Array.from(this._pendingAggregates.values());
		return dropUndefinedKeys({
			attrs: this._sessionAttrs,
			aggregates
		});
	}
	/** JSDoc */
	close() {
		clearInterval(this._intervalId);
		this._isEnabled = false;
		this.flush();
	}
	/**
	* Wrapper function for _incrementSessionStatusCount that checks if the instance of SessionFlusher is enabled then
	* fetches the session status of the request from `Scope.getRequestSession().status` on the scope and passes them to
	* `_incrementSessionStatusCount` along with the start date
	*/
	incrementSessionStatusCount() {
		if (!this._isEnabled) return;
		const isolationScope = getIsolationScope();
		const requestSession = isolationScope.getRequestSession();
		if (requestSession && requestSession.status) {
			this._incrementSessionStatusCount(requestSession.status, /* @__PURE__ */ new Date());
			isolationScope.setRequestSession(void 0);
		}
	}
	/**
	* Increments status bucket in pendingAggregates buffer (internal state) corresponding to status of
	* the session received
	*/
	_incrementSessionStatusCount(status, date) {
		const sessionStartedTrunc = new Date(date).setSeconds(0, 0);
		let aggregationCounts = this._pendingAggregates.get(sessionStartedTrunc);
		if (!aggregationCounts) {
			aggregationCounts = { started: new Date(sessionStartedTrunc).toISOString() };
			this._pendingAggregates.set(sessionStartedTrunc, aggregationCounts);
		}
		switch (status) {
			case "errored":
				aggregationCounts.errored = (aggregationCounts.errored || 0) + 1;
				return aggregationCounts.errored;
			case "ok":
				aggregationCounts.exited = (aggregationCounts.exited || 0) + 1;
				return aggregationCounts.exited;
			default:
				aggregationCounts.crashed = (aggregationCounts.crashed || 0) + 1;
				return aggregationCounts.crashed;
		}
	}
};
//#endregion
//#region node_modules/@sentry/core/build/esm/api.js
const SENTRY_API_VERSION = "7";
/** Returns the prefix to construct Sentry ingestion API endpoints. */
function getBaseApiEndpoint(dsn) {
	const protocol = dsn.protocol ? `${dsn.protocol}:` : "";
	const port = dsn.port ? `:${dsn.port}` : "";
	return `${protocol}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
}
/** Returns the ingest API endpoint for target. */
function _getIngestEndpoint(dsn) {
	return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
}
/** Returns a URL-encoded string with auth config suitable for a query string. */
function _encodedAuth(dsn, sdkInfo) {
	return urlEncode({
		sentry_key: dsn.publicKey,
		sentry_version: SENTRY_API_VERSION,
		...sdkInfo && { sentry_client: `${sdkInfo.name}/${sdkInfo.version}` }
	});
}
/**
* Returns the envelope endpoint URL with auth in the query string.
*
* Sending auth as part of the query string and not as custom HTTP headers avoids CORS preflight requests.
*/
function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
	return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/integration.js
const installedIntegrations = [];
/**
* Given a list of integration instances this installs them all. When `withDefaults` is set to `true` then all default
* integrations are added unless they were already provided before.
* @param integrations array of integration instances
* @param withDefault should enable default integrations
*/
function setupIntegrations(client, integrations) {
	const integrationIndex = {};
	integrations.forEach((integration) => {
		if (integration) setupIntegration(client, integration, integrationIndex);
	});
	return integrationIndex;
}
/**
* Execute the `afterAllSetup` hooks of the given integrations.
*/
function afterSetupIntegrations(client, integrations) {
	for (const integration of integrations) if (integration && integration.afterAllSetup) integration.afterAllSetup(client);
}
/** Setup a single integration.  */
function setupIntegration(client, integration, integrationIndex) {
	if (integrationIndex[integration.name]) {
		DEBUG_BUILD && logger.log(`Integration skipped because it was already installed: ${integration.name}`);
		return;
	}
	integrationIndex[integration.name] = integration;
	if (installedIntegrations.indexOf(integration.name) === -1 && typeof integration.setupOnce === "function") {
		integration.setupOnce();
		installedIntegrations.push(integration.name);
	}
	if (integration.setup && typeof integration.setup === "function") integration.setup(client);
	if (typeof integration.preprocessEvent === "function") {
		const callback = integration.preprocessEvent.bind(integration);
		client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
	}
	if (typeof integration.processEvent === "function") {
		const callback = integration.processEvent.bind(integration);
		const processor = Object.assign((event, hint) => callback(event, hint, client), { id: integration.name });
		client.addEventProcessor(processor);
	}
	DEBUG_BUILD && logger.log(`Integration installed: ${integration.name}`);
}
//#endregion
//#region node_modules/@sentry/core/build/esm/baseclient.js
const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
/**
* Base implementation for all JavaScript SDK clients.
*
* Call the constructor with the corresponding options
* specific to the client subclass. To access these options later, use
* {@link Client.getOptions}.
*
* If a Dsn is specified in the options, it will be parsed and stored. Use
* {@link Client.getDsn} to retrieve the Dsn at any moment. In case the Dsn is
* invalid, the constructor will throw a {@link SentryException}. Note that
* without a valid Dsn, the SDK will not send any events to Sentry.
*
* Before sending an event, it is passed through
* {@link BaseClient._prepareEvent} to add SDK information and scope data
* (breadcrumbs and context). To add more custom information, override this
* method and extend the resulting prepared event.
*
* To issue automatically created events (e.g. via instrumentation), use
* {@link Client.captureEvent}. It will prepare the event and pass it through
* the callback lifecycle. To issue auto-breadcrumbs, use
* {@link Client.addBreadcrumb}.
*
* @example
* class NodeClient extends BaseClient<NodeOptions> {
*   public constructor(options: NodeOptions) {
*     super(options);
*   }
*
*   // ...
* }
*/
var BaseClient = class {
	/** Options passed to the SDK. */
	/** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
	/** Array of set up integrations. */
	/** Number of calls being processed */
	/** Holds flushable  */
	/**
	* Initializes this client instance.
	*
	* @param options Options for the client.
	*/
	constructor(options) {
		this._options = options;
		this._integrations = {};
		this._numProcessing = 0;
		this._outcomes = {};
		this._hooks = {};
		this._eventProcessors = [];
		if (options.dsn) this._dsn = makeDsn(options.dsn);
		else DEBUG_BUILD && logger.warn("No DSN provided, client will not send events.");
		if (this._dsn) {
			const url = getEnvelopeEndpointWithUrlEncodedAuth(this._dsn, options.tunnel, options._metadata ? options._metadata.sdk : void 0);
			this._transport = options.transport({
				tunnel: this._options.tunnel,
				recordDroppedEvent: this.recordDroppedEvent.bind(this),
				...options.transportOptions,
				url
			});
		}
	}
	/**
	* @inheritDoc
	*/
	captureException(exception, hint, scope) {
		const eventId = uuid4();
		if (checkOrSetAlreadyCaught(exception)) {
			DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
			return eventId;
		}
		const hintWithEventId = {
			event_id: eventId,
			...hint
		};
		this._process(this.eventFromException(exception, hintWithEventId).then((event) => this._captureEvent(event, hintWithEventId, scope)));
		return hintWithEventId.event_id;
	}
	/**
	* @inheritDoc
	*/
	captureMessage(message, level, hint, currentScope) {
		const hintWithEventId = {
			event_id: uuid4(),
			...hint
		};
		const eventMessage = isParameterizedString(message) ? message : String(message);
		const promisedEvent = isPrimitive(message) ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
		this._process(promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)));
		return hintWithEventId.event_id;
	}
	/**
	* @inheritDoc
	*/
	captureEvent(event, hint, currentScope) {
		const eventId = uuid4();
		if (hint && hint.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
			DEBUG_BUILD && logger.log(ALREADY_SEEN_ERROR);
			return eventId;
		}
		const hintWithEventId = {
			event_id: eventId,
			...hint
		};
		const capturedSpanScope = (event.sdkProcessingMetadata || {}).capturedSpanScope;
		this._process(this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope));
		return hintWithEventId.event_id;
	}
	/**
	* @inheritDoc
	*/
	captureSession(session) {
		if (!(typeof session.release === "string")) DEBUG_BUILD && logger.warn("Discarded session because of missing or non-string release");
		else {
			this.sendSession(session);
			updateSession(session, { init: false });
		}
	}
	/**
	* @inheritDoc
	*/
	getDsn() {
		return this._dsn;
	}
	/**
	* @inheritDoc
	*/
	getOptions() {
		return this._options;
	}
	/**
	* @see SdkMetadata in @sentry/types
	*
	* @return The metadata of the SDK
	*/
	getSdkMetadata() {
		return this._options._metadata;
	}
	/**
	* @inheritDoc
	*/
	getTransport() {
		return this._transport;
	}
	/**
	* @inheritDoc
	*/
	flush(timeout) {
		const transport = this._transport;
		if (transport) {
			this.emit("flush");
			return this._isClientDoneProcessing(timeout).then((clientFinished) => {
				return transport.flush(timeout).then((transportFlushed) => clientFinished && transportFlushed);
			});
		} else return resolvedSyncPromise(true);
	}
	/**
	* @inheritDoc
	*/
	close(timeout) {
		return this.flush(timeout).then((result) => {
			this.getOptions().enabled = false;
			this.emit("close");
			return result;
		});
	}
	/** Get all installed event processors. */
	getEventProcessors() {
		return this._eventProcessors;
	}
	/** @inheritDoc */
	addEventProcessor(eventProcessor) {
		this._eventProcessors.push(eventProcessor);
	}
	/** @inheritdoc */
	init() {
		if (this._isEnabled() || this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) this._setupIntegrations();
	}
	/**
	* Gets an installed integration by its name.
	*
	* @returns The installed integration or `undefined` if no integration with that `name` was installed.
	*/
	getIntegrationByName(integrationName) {
		return this._integrations[integrationName];
	}
	/**
	* @inheritDoc
	*/
	addIntegration(integration) {
		const isAlreadyInstalled = this._integrations[integration.name];
		setupIntegration(this, integration, this._integrations);
		if (!isAlreadyInstalled) afterSetupIntegrations(this, [integration]);
	}
	/**
	* @inheritDoc
	*/
	sendEvent(event, hint = {}) {
		this.emit("beforeSendEvent", event, hint);
		let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
		for (const attachment of hint.attachments || []) env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
		const promise = this.sendEnvelope(env);
		if (promise) promise.then((sendResponse) => this.emit("afterSendEvent", event, sendResponse), null);
	}
	/**
	* @inheritDoc
	*/
	sendSession(session) {
		const env = createSessionEnvelope(session, this._dsn, this._options._metadata, this._options.tunnel);
		this.sendEnvelope(env);
	}
	/**
	* @inheritDoc
	*/
	recordDroppedEvent(reason, category, eventOrCount) {
		if (this._options.sendClientReports) {
			const count = typeof eventOrCount === "number" ? eventOrCount : 1;
			const key = `${reason}:${category}`;
			DEBUG_BUILD && logger.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
			this._outcomes[key] = (this._outcomes[key] || 0) + count;
		}
	}
	/** @inheritdoc */
	/** @inheritdoc */
	on(hook, callback) {
		const hooks = this._hooks[hook] = this._hooks[hook] || [];
		hooks.push(callback);
		return () => {
			const cbIndex = hooks.indexOf(callback);
			if (cbIndex > -1) hooks.splice(cbIndex, 1);
		};
	}
	/** @inheritdoc */
	/** @inheritdoc */
	emit(hook, ...rest) {
		const callbacks = this._hooks[hook];
		if (callbacks) callbacks.forEach((callback) => callback(...rest));
	}
	/**
	* @inheritdoc
	*/
	sendEnvelope(envelope) {
		this.emit("beforeEnvelope", envelope);
		if (this._isEnabled() && this._transport) return this._transport.send(envelope).then(null, (reason) => {
			DEBUG_BUILD && logger.error("Error while sending event:", reason);
			return reason;
		});
		DEBUG_BUILD && logger.error("Transport disabled");
		return resolvedSyncPromise({});
	}
	/** Setup integrations for this client. */
	_setupIntegrations() {
		const { integrations } = this._options;
		this._integrations = setupIntegrations(this, integrations);
		afterSetupIntegrations(this, integrations);
	}
	/** Updates existing session based on the provided event */
	_updateSessionFromEvent(session, event) {
		let crashed = false;
		let errored = false;
		const exceptions = event.exception && event.exception.values;
		if (exceptions) {
			errored = true;
			for (const ex of exceptions) {
				const mechanism = ex.mechanism;
				if (mechanism && mechanism.handled === false) {
					crashed = true;
					break;
				}
			}
		}
		const sessionNonTerminal = session.status === "ok";
		if (sessionNonTerminal && session.errors === 0 || sessionNonTerminal && crashed) {
			updateSession(session, {
				...crashed && { status: "crashed" },
				errors: session.errors || Number(errored || crashed)
			});
			this.captureSession(session);
		}
	}
	/**
	* Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
	* "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
	*
	* @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
	* passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
	* `true`.
	* @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
	* `false` otherwise
	*/
	_isClientDoneProcessing(timeout) {
		return new SyncPromise((resolve) => {
			let ticked = 0;
			const tick = 1;
			const interval = setInterval(() => {
				if (this._numProcessing == 0) {
					clearInterval(interval);
					resolve(true);
				} else {
					ticked += tick;
					if (timeout && ticked >= timeout) {
						clearInterval(interval);
						resolve(false);
					}
				}
			}, tick);
		});
	}
	/** Determines whether this SDK is enabled and a transport is present. */
	_isEnabled() {
		return this.getOptions().enabled !== false && this._transport !== void 0;
	}
	/**
	* Adds common information to events.
	*
	* The information includes release and environment from `options`,
	* breadcrumbs and context (extra, tags and user) from the scope.
	*
	* Information that is already present in the event is never overwritten. For
	* nested objects, such as the context, keys are merged.
	*
	* @param event The original event.
	* @param hint May contain additional information about the original exception.
	* @param currentScope A scope containing event metadata.
	* @returns A new event with more information.
	*/
	_prepareEvent(event, hint, currentScope, isolationScope = getIsolationScope()) {
		const options = this.getOptions();
		const integrations = Object.keys(this._integrations);
		if (!hint.integrations && integrations.length > 0) hint.integrations = integrations;
		this.emit("preprocessEvent", event, hint);
		if (!event.type) isolationScope.setLastEventId(event.event_id || hint.event_id);
		return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
			if (evt === null) return evt;
			const propagationContext = {
				...isolationScope.getPropagationContext(),
				...currentScope ? currentScope.getPropagationContext() : void 0
			};
			if (!(evt.contexts && evt.contexts.trace) && propagationContext) {
				const { traceId: trace_id, spanId, parentSpanId, dsc } = propagationContext;
				evt.contexts = {
					trace: dropUndefinedKeys({
						trace_id,
						span_id: spanId,
						parent_span_id: parentSpanId
					}),
					...evt.contexts
				};
				evt.sdkProcessingMetadata = {
					dynamicSamplingContext: dsc ? dsc : getDynamicSamplingContextFromClient(trace_id, this),
					...evt.sdkProcessingMetadata
				};
			}
			return evt;
		});
	}
	/**
	* Processes the event and logs an error in case of rejection
	* @param event
	* @param hint
	* @param scope
	*/
	_captureEvent(event, hint = {}, scope) {
		return this._processEvent(event, hint, scope).then((finalEvent) => {
			return finalEvent.event_id;
		}, (reason) => {
			if (DEBUG_BUILD) {
				const sentryError = reason;
				if (sentryError.logLevel === "log") logger.log(sentryError.message);
				else logger.warn(sentryError);
			}
		});
	}
	/**
	* Processes an event (either error or message) and sends it to Sentry.
	*
	* This also adds breadcrumbs and context information to the event. However,
	* platform specific meta data (such as the User's IP address) must be added
	* by the SDK implementor.
	*
	*
	* @param event The event to send to Sentry.
	* @param hint May contain additional information about the original exception.
	* @param currentScope A scope containing event metadata.
	* @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
	*/
	_processEvent(event, hint, currentScope) {
		const options = this.getOptions();
		const { sampleRate } = options;
		const isTransaction = isTransactionEvent(event);
		const isError = isErrorEvent(event);
		const eventType = event.type || "error";
		const beforeSendLabel = `before send for type \`${eventType}\``;
		const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
		if (isError && typeof parsedSampleRate === "number" && Math.random() > parsedSampleRate) {
			this.recordDroppedEvent("sample_rate", "error", event);
			return rejectedSyncPromise(new SentryError(`Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`, "log"));
		}
		const dataCategory = eventType === "replay_event" ? "replay" : eventType;
		const capturedSpanIsolationScope = (event.sdkProcessingMetadata || {}).capturedSpanIsolationScope;
		return this._prepareEvent(event, hint, currentScope, capturedSpanIsolationScope).then((prepared) => {
			if (prepared === null) {
				this.recordDroppedEvent("event_processor", dataCategory, event);
				throw new SentryError("An event processor returned `null`, will not send event.", "log");
			}
			if (hint.data && hint.data.__sentry__ === true) return prepared;
			return _validateBeforeSendResult(processBeforeSend(this, options, prepared, hint), beforeSendLabel);
		}).then((processedEvent) => {
			if (processedEvent === null) {
				this.recordDroppedEvent("before_send", dataCategory, event);
				if (isTransaction) {
					const spanCount = 1 + (event.spans || []).length;
					this.recordDroppedEvent("before_send", "span", spanCount);
				}
				throw new SentryError(`${beforeSendLabel} returned \`null\`, will not send event.`, "log");
			}
			const session = currentScope && currentScope.getSession();
			if (!isTransaction && session) this._updateSessionFromEvent(session, processedEvent);
			if (isTransaction) {
				const droppedSpanCount = (processedEvent.sdkProcessingMetadata && processedEvent.sdkProcessingMetadata.spanCountBeforeProcessing || 0) - (processedEvent.spans ? processedEvent.spans.length : 0);
				if (droppedSpanCount > 0) this.recordDroppedEvent("before_send", "span", droppedSpanCount);
			}
			const transactionInfo = processedEvent.transaction_info;
			if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
				const source = "custom";
				processedEvent.transaction_info = {
					...transactionInfo,
					source
				};
			}
			this.sendEvent(processedEvent, hint);
			return processedEvent;
		}).then(null, (reason) => {
			if (reason instanceof SentryError) throw reason;
			this.captureException(reason, {
				data: { __sentry__: true },
				originalException: reason
			});
			throw new SentryError(`Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${reason}`);
		});
	}
	/**
	* Occupies the client with processing and event
	*/
	_process(promise) {
		this._numProcessing++;
		promise.then((value) => {
			this._numProcessing--;
			return value;
		}, (reason) => {
			this._numProcessing--;
			return reason;
		});
	}
	/**
	* Clears outcomes on this client and returns them.
	*/
	_clearOutcomes() {
		const outcomes = this._outcomes;
		this._outcomes = {};
		return Object.entries(outcomes).map(([key, quantity]) => {
			const [reason, category] = key.split(":");
			return {
				reason,
				category,
				quantity
			};
		});
	}
	/**
	* Sends client reports as an envelope.
	*/
	_flushOutcomes() {
		DEBUG_BUILD && logger.log("Flushing outcomes...");
		const outcomes = this._clearOutcomes();
		if (outcomes.length === 0) {
			DEBUG_BUILD && logger.log("No outcomes to send");
			return;
		}
		if (!this._dsn) {
			DEBUG_BUILD && logger.log("No dsn provided, will not send outcomes");
			return;
		}
		DEBUG_BUILD && logger.log("Sending outcomes:", outcomes);
		const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
		this.sendEnvelope(envelope);
	}
};
/**
* Verifies that return value of configured `beforeSend` or `beforeSendTransaction` is of expected type, and returns the value if so.
*/
function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
	const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
	if (isThenable(beforeSendResult)) return beforeSendResult.then((event) => {
		if (!isPlainObject(event) && event !== null) throw new SentryError(invalidValueError);
		return event;
	}, (e) => {
		throw new SentryError(`${beforeSendLabel} rejected with ${e}`);
	});
	else if (!isPlainObject(beforeSendResult) && beforeSendResult !== null) throw new SentryError(invalidValueError);
	return beforeSendResult;
}
/**
* Process the matching `beforeSendXXX` callback.
*/
function processBeforeSend(client, options, event, hint) {
	const { beforeSend, beforeSendTransaction, beforeSendSpan } = options;
	if (isErrorEvent(event) && beforeSend) return beforeSend(event, hint);
	if (isTransactionEvent(event)) {
		if (event.spans && beforeSendSpan) {
			const processedSpans = [];
			for (const span of event.spans) {
				const processedSpan = beforeSendSpan(span);
				if (processedSpan) processedSpans.push(processedSpan);
				else client.recordDroppedEvent("before_send", "span");
			}
			event.spans = processedSpans;
		}
		if (beforeSendTransaction) {
			if (event.spans) {
				const spanCountBefore = event.spans.length;
				event.sdkProcessingMetadata = {
					...event.sdkProcessingMetadata,
					spanCountBeforeProcessing: spanCountBefore
				};
			}
			return beforeSendTransaction(event, hint);
		}
	}
	return event;
}
function isErrorEvent(event) {
	return event.type === void 0;
}
function isTransactionEvent(event) {
	return event.type === "transaction";
}
//#endregion
//#region node_modules/@sentry/core/build/esm/checkin.js
/**
* Create envelope from check in item.
*/
function createCheckInEnvelope(checkIn, dynamicSamplingContext, metadata, tunnel, dsn) {
	const headers = { sent_at: (/* @__PURE__ */ new Date()).toISOString() };
	if (metadata && metadata.sdk) headers.sdk = {
		name: metadata.sdk.name,
		version: metadata.sdk.version
	};
	if (!!tunnel && !!dsn) headers.dsn = dsnToString(dsn);
	if (dynamicSamplingContext) headers.trace = dropUndefinedKeys(dynamicSamplingContext);
	return createEnvelope(headers, [createCheckInEnvelopeItem(checkIn)]);
}
function createCheckInEnvelopeItem(checkIn) {
	return [{ type: "check_in" }, checkIn];
}
//#endregion
//#region node_modules/@sentry/core/build/esm/server-runtime-client.js
/**
* The Sentry Server Runtime Client SDK.
*/
var ServerRuntimeClient = class extends BaseClient {
	/**
	* Creates a new Edge SDK instance.
	* @param options Configuration options for this SDK.
	*/
	constructor(options) {
		registerSpanErrorInstrumentation();
		super(options);
	}
	/**
	* @inheritDoc
	*/
	eventFromException(exception, hint) {
		return resolvedSyncPromise(eventFromUnknownInput(this, this._options.stackParser, exception, hint));
	}
	/**
	* @inheritDoc
	*/
	eventFromMessage(message, level = "info", hint) {
		return resolvedSyncPromise(eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace));
	}
	/**
	* @inheritDoc
	*/
	captureException(exception, hint, scope) {
		if (this._options.autoSessionTracking && this._sessionFlusher) {
			const requestSession = getIsolationScope().getRequestSession();
			if (requestSession && requestSession.status === "ok") requestSession.status = "errored";
		}
		return super.captureException(exception, hint, scope);
	}
	/**
	* @inheritDoc
	*/
	captureEvent(event, hint, scope) {
		if (this._options.autoSessionTracking && this._sessionFlusher) {
			if ((event.type || "exception") === "exception" && event.exception && event.exception.values && event.exception.values.length > 0) {
				const requestSession = getIsolationScope().getRequestSession();
				if (requestSession && requestSession.status === "ok") requestSession.status = "errored";
			}
		}
		return super.captureEvent(event, hint, scope);
	}
	/**
	*
	* @inheritdoc
	*/
	close(timeout) {
		if (this._sessionFlusher) this._sessionFlusher.close();
		return super.close(timeout);
	}
	/** Method that initialises an instance of SessionFlusher on Client */
	initSessionFlusher() {
		const { release, environment } = this._options;
		if (!release) DEBUG_BUILD && logger.warn("Cannot initialise an instance of SessionFlusher if no release is provided!");
		else this._sessionFlusher = new SessionFlusher(this, {
			release,
			environment
		});
	}
	/**
	* Create a cron monitor check in and send it to Sentry.
	*
	* @param checkIn An object that describes a check in.
	* @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
	* to create a monitor automatically when sending a check in.
	*/
	captureCheckIn(checkIn, monitorConfig, scope) {
		const id = "checkInId" in checkIn && checkIn.checkInId ? checkIn.checkInId : uuid4();
		if (!this._isEnabled()) {
			DEBUG_BUILD && logger.warn("SDK not enabled, will not capture checkin.");
			return id;
		}
		const { release, environment, tunnel } = this.getOptions();
		const serializedCheckIn = {
			check_in_id: id,
			monitor_slug: checkIn.monitorSlug,
			status: checkIn.status,
			release,
			environment
		};
		if ("duration" in checkIn) serializedCheckIn.duration = checkIn.duration;
		if (monitorConfig) serializedCheckIn.monitor_config = {
			schedule: monitorConfig.schedule,
			checkin_margin: monitorConfig.checkinMargin,
			max_runtime: monitorConfig.maxRuntime,
			timezone: monitorConfig.timezone,
			failure_issue_threshold: monitorConfig.failureIssueThreshold,
			recovery_threshold: monitorConfig.recoveryThreshold
		};
		const [dynamicSamplingContext, traceContext] = this._getTraceInfoFromScope(scope);
		if (traceContext) serializedCheckIn.contexts = { trace: traceContext };
		const envelope = createCheckInEnvelope(serializedCheckIn, dynamicSamplingContext, this.getSdkMetadata(), tunnel, this.getDsn());
		DEBUG_BUILD && logger.info("Sending checkin:", checkIn.monitorSlug, checkIn.status);
		this.sendEnvelope(envelope);
		return id;
	}
	/**
	* Method responsible for capturing/ending a request session by calling `incrementSessionStatusCount` to increment
	* appropriate session aggregates bucket
	*/
	_captureRequestSession() {
		if (!this._sessionFlusher) DEBUG_BUILD && logger.warn("Discarded request mode session because autoSessionTracking option was disabled");
		else this._sessionFlusher.incrementSessionStatusCount();
	}
	/**
	* @inheritDoc
	*/
	_prepareEvent(event, hint, scope, isolationScope) {
		if (this._options.platform) event.platform = event.platform || this._options.platform;
		if (this._options.runtime) event.contexts = {
			...event.contexts,
			runtime: (event.contexts || {}).runtime || this._options.runtime
		};
		if (this._options.serverName) event.server_name = event.server_name || this._options.serverName;
		return super._prepareEvent(event, hint, scope, isolationScope);
	}
	/** Extract trace information from scope */
	_getTraceInfoFromScope(scope) {
		if (!scope) return [void 0, void 0];
		const span = _getSpanForScope(scope);
		if (span) {
			const rootSpan = getRootSpan(span);
			return [getDynamicSamplingContextFromSpan(rootSpan), spanToTraceContext(rootSpan)];
		}
		const { traceId, spanId, parentSpanId, dsc } = scope.getPropagationContext();
		const traceContext = {
			trace_id: traceId,
			span_id: spanId,
			parent_span_id: parentSpanId
		};
		if (dsc) return [dsc, traceContext];
		return [getDynamicSamplingContextFromClient(traceId, this), traceContext];
	}
};
/**
* Creates an instance of a Sentry `Transport`
*
* @param options
* @param makeRequest
*/
function createTransport(options, makeRequest, buffer = makePromiseBuffer(options.bufferSize || 64)) {
	let rateLimits = {};
	const flush = (timeout) => buffer.drain(timeout);
	function send(envelope) {
		const filteredEnvelopeItems = [];
		forEachEnvelopeItem(envelope, (item, type) => {
			const dataCategory = envelopeItemTypeToDataCategory(type);
			if (isRateLimited(rateLimits, dataCategory)) {
				const event = getEventForEnvelopeItem(item, type);
				options.recordDroppedEvent("ratelimit_backoff", dataCategory, event);
			} else filteredEnvelopeItems.push(item);
		});
		if (filteredEnvelopeItems.length === 0) return resolvedSyncPromise({});
		const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
		const recordEnvelopeLoss = (reason) => {
			forEachEnvelopeItem(filteredEnvelope, (item, type) => {
				const event = getEventForEnvelopeItem(item, type);
				options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type), event);
			});
		};
		const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then((response) => {
			if (response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) DEBUG_BUILD && logger.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
			rateLimits = updateRateLimits(rateLimits, response);
			return response;
		}, (error) => {
			recordEnvelopeLoss("network_error");
			throw error;
		});
		return buffer.add(requestTask).then((result) => result, (error) => {
			if (error instanceof SentryError) {
				DEBUG_BUILD && logger.error("Skipped sending event because buffer is full.");
				recordEnvelopeLoss("queue_overflow");
				return resolvedSyncPromise({});
			} else throw error;
		});
	}
	return {
		send,
		flush
	};
}
function getEventForEnvelopeItem(item, type) {
	if (type !== "event" && type !== "transaction") return;
	return Array.isArray(item) ? item[1] : void 0;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/sdkMetadata.js
/**
* A builder for the SDK metadata in the options for the SDK initialization.
*
* Note: This function is identical to `buildMetadata` in Remix and NextJS and SvelteKit.
* We don't extract it for bundle size reasons.
* @see https://github.com/getsentry/sentry-javascript/pull/7404
* @see https://github.com/getsentry/sentry-javascript/pull/4196
*
* If you make changes to this function consider updating the others as well.
*
* @param options SDK options object that gets mutated
* @param names list of package names
*/
function applySdkMetadata(options, name, names = [name], source = "npm") {
	const metadata = options._metadata || {};
	if (!metadata.sdk) metadata.sdk = {
		name: `sentry.javascript.${name}`,
		packages: names.map((name) => ({
			name: `${source}:@sentry/${name}`,
			version: SDK_VERSION
		})),
		version: SDK_VERSION
	};
	options._metadata = metadata;
}
//#endregion
//#region node_modules/@sentry/core/build/esm/utils/traceData.js
/**
* Extracts trace propagation data from the current span or from the client's scope (via transaction or propagation
* context) and serializes it to `sentry-trace` and `baggage` values to strings. These values can be used to propagate
* a trace via our tracing Http headers or Html `<meta>` tags.
*
* This function also applies some validation to the generated sentry-trace and baggage values to ensure that
* only valid strings are returned.
*
* @returns an object with the tracing data values. The object keys are the name of the tracing key to be used as header
* or meta tag name.
*/
function getTraceData() {
	const acs = getAsyncContextStrategy(getMainCarrier());
	if (acs.getTraceData) return acs.getTraceData();
	const client = getClient();
	const scope = getCurrentScope();
	const span = getActiveSpan();
	const { dsc, sampled, traceId } = scope.getPropagationContext();
	const rootSpan = span && getRootSpan(span);
	const sentryTrace = span ? spanToTraceHeader(span) : generateSentryTraceHeader(traceId, void 0, sampled);
	const baggage = dynamicSamplingContextToSentryBaggageHeader(rootSpan ? getDynamicSamplingContextFromSpan(rootSpan) : dsc ? dsc : client ? getDynamicSamplingContextFromClient(traceId, client) : void 0);
	if (!TRACEPARENT_REGEXP.test(sentryTrace)) {
		logger.warn("Invalid sentry-trace data. Cannot generate trace data");
		return {};
	}
	const validBaggage = isValidBaggageString(baggage);
	if (!validBaggage) logger.warn("Invalid baggage data. Not returning \"baggage\" value");
	return {
		"sentry-trace": sentryTrace,
		...validBaggage && { baggage }
	};
}
/**
* Tests string against baggage spec as defined in:
*
* - W3C Baggage grammar: https://www.w3.org/TR/baggage/#definition
* - RFC7230 token definition: https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
*
* exported for testing
*/
function isValidBaggageString(baggage) {
	if (!baggage || !baggage.length) return false;
	const keyRegex = "[-!#$%&'*+.^_`|~A-Za-z0-9]+";
	const valueRegex = "[!#-+-./0-9:<=>?@A-Z\\[\\]a-z{-}]+";
	const spaces = "\\s*";
	return new RegExp(`^${keyRegex}${spaces}=${spaces}${valueRegex}(${spaces},${spaces}${keyRegex}${spaces}=${spaces}${valueRegex})*$`).test(baggage);
}
function normalizeUserOptions(userOptions) {
	const options = {
		org: userOptions.org ?? process.env["SENTRY_ORG"],
		project: userOptions.project ?? (process.env["SENTRY_PROJECT"]?.includes(",") ? process.env["SENTRY_PROJECT"].split(",").map((p) => p.trim()) : process.env["SENTRY_PROJECT"]),
		authToken: userOptions.authToken ?? process.env["SENTRY_AUTH_TOKEN"],
		url: userOptions.url ?? process.env["SENTRY_URL"] ?? "https://sentry.io",
		headers: userOptions.headers,
		debug: userOptions.debug ?? false,
		silent: userOptions.silent ?? false,
		errorHandler: userOptions.errorHandler,
		telemetry: userOptions.telemetry ?? true,
		disable: userOptions.disable ?? false,
		sourcemaps: userOptions.sourcemaps,
		release: {
			...userOptions.release,
			name: userOptions.release?.name ?? process.env["SENTRY_RELEASE"] ?? determineReleaseName(),
			inject: userOptions.release?.inject ?? true,
			create: userOptions.release?.create ?? true,
			finalize: userOptions.release?.finalize ?? true,
			vcsRemote: userOptions.release?.vcsRemote ?? process.env["SENTRY_VSC_REMOTE"] ?? "origin",
			setCommits: userOptions.release?.setCommits
		},
		bundleSizeOptimizations: userOptions.bundleSizeOptimizations,
		reactComponentAnnotation: userOptions.reactComponentAnnotation,
		_metaOptions: { telemetry: {
			metaFramework: userOptions._metaOptions?.telemetry?.metaFramework,
			bundlerMajorVersion: userOptions._metaOptions?.telemetry?.bundlerMajorVersion
		} },
		applicationKey: userOptions.applicationKey,
		moduleMetadata: userOptions.moduleMetadata,
		_experiments: userOptions._experiments ?? {}
	};
	if (options.release.setCommits === void 0) if (process.env["VERCEL"] && process.env["VERCEL_GIT_COMMIT_SHA"] && process.env["VERCEL_GIT_REPO_SLUG"] && process.env["VERCEL_GIT_REPO_OWNER"] && process.env["VERCEL_TARGET_ENV"] === "production") options.release.setCommits = {
		shouldNotThrowOnFailure: true,
		commit: process.env["VERCEL_GIT_COMMIT_SHA"],
		previousCommit: process.env["VERCEL_GIT_PREVIOUS_SHA"],
		repo: `${process.env["VERCEL_GIT_REPO_OWNER"]}/${process.env["VERCEL_GIT_REPO_SLUG"]}`,
		ignoreEmpty: true,
		ignoreMissing: true
	};
	else options.release.setCommits = {
		shouldNotThrowOnFailure: true,
		auto: true,
		ignoreEmpty: true,
		ignoreMissing: true
	};
	if (options.release.deploy === void 0 && process.env["VERCEL"] && process.env["VERCEL_TARGET_ENV"]) options.release.deploy = {
		env: `vercel-${process.env["VERCEL_TARGET_ENV"]}`,
		url: process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : void 0
	};
	return options;
}
/**
* Validates a few combinations of options that are not checked by Sentry CLI.
*
* For all other options, we can rely on Sentry CLI to validate them. In fact,
* we can't validate them in the plugin because Sentry CLI might pick up options from
* its config file.
*
* @param options the internal options
* @param logger the logger
*
* @returns `true` if the options are valid, `false` otherwise
*/
function validateOptions(options, logger) {
	const setCommits = options.release?.setCommits;
	if (setCommits) {
		if (!setCommits.auto && !(setCommits.repo && setCommits.commit)) {
			logger.error("The `setCommits` option was specified but is missing required properties.", "Please set either `auto` or both, `repo` and `commit`.");
			return false;
		}
		if (setCommits.auto && setCommits.repo && setCommits) logger.warn("The `setCommits` options includes `auto` but also `repo` and `commit`.", "Ignoring `repo` and `commit`.", "Please only set either `auto` or both, `repo` and `commit`.");
	}
	if (options.release?.deploy && typeof options.release.deploy === "object" && !options.release.deploy.env) {
		logger.error("The `deploy` option was specified but is missing the required `env` property.", "Please set the `env` property.");
		return false;
	}
	if (options.project && Array.isArray(options.project)) {
		if (options.project.length === 0) {
			logger.error("The `project` option was specified as an array but is empty.", "Please provide at least one project slug.");
			return false;
		}
		if (options.project.filter((p) => typeof p !== "string" || p.trim() === "").length > 0) {
			logger.error("The `project` option contains invalid project slugs.", "All projects must be non-empty strings.");
			return false;
		}
	}
	return true;
}
//#endregion
//#region src/logger.ts
function createLogger(options) {
	return {
		info(message, ...params) {
			if (!options.silent) console.info(`${options.prefix} Info: ${message}`, ...params);
		},
		warn(message, ...params) {
			if (!options.silent) console.warn(`${options.prefix} Warning: ${message}`, ...params);
		},
		error(message, ...params) {
			if (!options.silent) console.error(`${options.prefix} Error: ${message}`, ...params);
		},
		debug(message, ...params) {
			if (!options.silent && options.debug) console.debug(`${options.prefix} Debug: ${message}`, ...params);
		}
	};
}
//#endregion
//#region src/sentry/transports.ts
/**
* This is a simplified version of the Sentry Node SDK's HTTP transport.
*/
const GZIP_THRESHOLD = 1024 * 32;
/**
* Gets a stream from a Uint8Array or string
* Readable.from is ideal but was added in node.js v12.3.0 and v10.17.0
*/
function streamFromBody(body) {
	return new Readable({ read() {
		this.push(body);
		this.push(null);
	} });
}
/**
* Creates a RequestExecutor to be used with `createTransport`.
*/
function createRequestExecutor(options) {
	const { hostname, pathname, port, protocol, search } = new URL(options.url);
	return function makeRequest(request) {
		return new Promise((resolve, reject) => {
			suppressTracing(() => {
				let body = streamFromBody(request.body);
				const headers = {};
				if (request.body.length > GZIP_THRESHOLD) {
					headers["content-encoding"] = "gzip";
					body = body.pipe(createGzip());
				}
				const req = https.request({
					method: "POST",
					headers,
					hostname,
					path: `${pathname}${search}`,
					port,
					protocol
				}, (res) => {
					res.on("data", () => {});
					res.on("end", () => {});
					res.setEncoding("utf8");
					const retryAfterHeader = res.headers["retry-after"] ?? null;
					const rateLimitsHeader = res.headers["x-sentry-rate-limits"] ?? null;
					resolve({
						statusCode: res.statusCode,
						headers: {
							"retry-after": retryAfterHeader,
							"x-sentry-rate-limits": Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] || null : rateLimitsHeader
						}
					});
				});
				req.on("error", reject);
				body.pipe(req);
			});
		});
	};
}
/**
* Creates a Transport that uses native the native 'http' and 'https' modules to send events to Sentry.
*/
function makeNodeTransport(options) {
	return createTransport(options, createRequestExecutor(options));
}
/** A transport that can be optionally enabled as a later time than it's
* creation */
function makeOptionallyEnabledNodeTransport(shouldSendTelemetry) {
	return (nodeTransportOptions) => {
		const nodeTransport = makeNodeTransport(nodeTransportOptions);
		return {
			flush: (timeout) => nodeTransport.flush(timeout),
			send: async (request) => {
				if ("__SENTRY_INTERCEPT_TRANSPORT__" in global && Array.isArray(global.__SENTRY_INTERCEPT_TRANSPORT__)) {
					global.__SENTRY_INTERCEPT_TRANSPORT__.push(request);
					return { statusCode: 200 };
				}
				if (await shouldSendTelemetry) {
					if (process.env["SENTRY_TEST_OUT_DIR"]) {
						const { join } = await import("node:path");
						const { appendFileSync } = await import("node:fs");
						appendFileSync(join(process.env["SENTRY_TEST_OUT_DIR"], "sentry-telemetry.json"), JSON.stringify(request) + ",\n");
						return { statusCode: 200 };
					}
					return nodeTransport.send(request);
				}
				return { statusCode: 200 };
			}
		};
	};
}
//#endregion
//#region src/version.ts
const LIB_VERSION = "5.2.0";
//#endregion
//#region src/sentry/telemetry.ts
const SENTRY_SAAS_HOSTNAME = "sentry.io";
const stackParser = createStackParser(nodeStackLineParser());
function createSentryInstance(options, shouldSendTelemetry, buildTool, buildToolMajorVersion) {
	const clientOptions = {
		platform: "node",
		runtime: {
			name: "node",
			version: global.process.version
		},
		dsn: "https://4c2bae7d9fbc413e8f7385f55c515d51@o1.ingest.sentry.io/6690737",
		tracesSampleRate: 1,
		sampleRate: 1,
		release: LIB_VERSION,
		integrations: [],
		tracePropagationTargets: ["sentry.io/api"],
		stackParser,
		beforeSend: (event) => {
			event.exception?.values?.forEach((exception) => {
				delete exception.stacktrace;
			});
			delete event.server_name;
			return event;
		},
		beforeSendTransaction: (event) => {
			delete event.server_name;
			return event;
		},
		transport: makeOptionallyEnabledNodeTransport(shouldSendTelemetry)
	};
	applySdkMetadata(clientOptions, "node");
	const client = new ServerRuntimeClient(clientOptions);
	const scope = new Scope();
	scope.setClient(client);
	setTelemetryDataOnScope(options, scope, buildTool, buildToolMajorVersion);
	return {
		sentryScope: scope,
		sentryClient: client
	};
}
function setTelemetryDataOnScope(options, scope, buildTool, buildToolMajorVersion) {
	const { org, project, release, errorHandler, sourcemaps, reactComponentAnnotation } = options;
	scope.setTag("upload-legacy-sourcemaps", !!release.uploadLegacySourcemaps);
	if (release.uploadLegacySourcemaps) scope.setTag("uploadLegacySourcemapsEntries", Array.isArray(release.uploadLegacySourcemaps) ? release.uploadLegacySourcemaps.length : 1);
	scope.setTag("module-metadata", !!options.moduleMetadata);
	scope.setTag("inject-build-information", !!options._experiments.injectBuildInformation);
	if (release.setCommits) scope.setTag("set-commits", release.setCommits.auto === true ? "auto" : "manual");
	else scope.setTag("set-commits", "undefined");
	scope.setTag("finalize-release", release.finalize);
	scope.setTag("deploy-options", !!release.deploy);
	scope.setTag("custom-error-handler", !!errorHandler);
	scope.setTag("sourcemaps-assets", !!sourcemaps?.assets);
	scope.setTag("delete-after-upload", !!sourcemaps?.filesToDeleteAfterUpload);
	scope.setTag("sourcemaps-disabled", !!sourcemaps?.disable);
	scope.setTag("react-annotate", !!reactComponentAnnotation?.enabled);
	scope.setTag("node", process.version);
	scope.setTag("platform", process.platform);
	scope.setTag("meta-framework", options._metaOptions.telemetry.metaFramework ?? "none");
	scope.setTag("application-key-set", options.applicationKey !== void 0);
	scope.setTag("ci", !!process.env["CI"]);
	scope.setTags({
		organization: org,
		project: Array.isArray(project) ? project.join(", ") : project ?? "undefined",
		bundler: buildTool
	});
	if (buildToolMajorVersion) scope.setTag("bundler-major-version", buildToolMajorVersion);
	scope.setUser({ id: org });
}
async function allowedToSendTelemetry(options) {
	const { silent, org, project, authToken, url, headers, telemetry, release } = options;
	if (telemetry === false) return false;
	if (url === "https://sentry.io") return true;
	const cli = new SentryCli(null, {
		url,
		authToken,
		org,
		project: getProjects(project)?.[0],
		vcsRemote: release.vcsRemote,
		silent,
		headers
	});
	let cliInfo;
	try {
		cliInfo = await cli.execute(["info"], false);
	} catch (e) {
		return false;
	}
	const cliInfoUrl = cliInfo.split(/(\r\n|\n|\r)/)[0]?.replace(/^Sentry Server: /, "")?.trim();
	if (cliInfoUrl === void 0) return false;
	return new URL(cliInfoUrl).hostname === SENTRY_SAAS_HOSTNAME;
}
/**
* Flushing the SDK client can fail. We never want to crash the plugin because of telemetry.
*/
async function safeFlushTelemetry(sentryClient) {
	try {
		await sentryClient.flush(2e3);
	} catch {}
}
//#endregion
//#region src/debug-id-upload.ts
function createDebugIdUploadFunction({ sentryBuildPluginManager }) {
	return async (buildArtifactPaths) => {
		const cleanedPaths = buildArtifactPaths.map(stripQueryAndHashFromPath);
		await sentryBuildPluginManager.uploadSourcemaps(cleanedPaths);
	};
}
async function prepareBundleForDebugIdUpload(bundleFilePath, uploadFolder, chunkIndex, logger, rewriteSourcesHook, resolveSourceMapHook) {
	let bundleContent;
	try {
		bundleContent = await promisify(fs.readFile)(bundleFilePath, "utf8");
	} catch (e) {
		logger.error(`Could not read bundle to determine debug ID and source map: ${bundleFilePath}`, e);
		return;
	}
	const debugId = determineDebugIdFromBundleSource(bundleContent);
	if (debugId === void 0) {
		logger.debug(`Could not determine debug ID from bundle. This can happen if you did not clean your output folder before installing the Sentry plugin. File will not be source mapped: ${bundleFilePath}`);
		return;
	}
	const uniqueUploadName = `${debugId}-${chunkIndex}`;
	bundleContent = addDebugIdToBundleSource(bundleContent, debugId);
	const writeSourceFilePromise = fs.promises.writeFile(path.join(uploadFolder, `${uniqueUploadName}.js`), bundleContent, "utf-8");
	const writeSourceMapFilePromise = determineSourceMapPathFromBundle(bundleFilePath, bundleContent, logger, resolveSourceMapHook).then(async (sourceMapPath) => {
		if (sourceMapPath) await prepareSourceMapForDebugIdUpload(sourceMapPath, path.join(uploadFolder, `${uniqueUploadName}.js.map`), debugId, rewriteSourcesHook, logger);
	});
	await writeSourceFilePromise;
	await writeSourceMapFilePromise;
}
/**
* Looks for a particular string pattern (`sdbid-[debug ID]`) in the bundle
* source and extracts the bundle's debug ID from it.
*
* The string pattern is injected via the debug ID injection snipped.
*/
function determineDebugIdFromBundleSource(code) {
	const match = code.match(/sentry-dbid-([0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12})/);
	if (match) return match[1];
	else return;
}
const SPEC_LAST_DEBUG_ID_REGEX = /\/\/# debugId=([a-fA-F0-9-]+)(?![\s\S]*\/\/# debugId=)/m;
function hasSpecCompliantDebugId(bundleSource) {
	return SPEC_LAST_DEBUG_ID_REGEX.test(bundleSource);
}
function addDebugIdToBundleSource(bundleSource, debugId) {
	if (hasSpecCompliantDebugId(bundleSource)) return bundleSource.replace(SPEC_LAST_DEBUG_ID_REGEX, `//# debugId=${debugId}`);
	else return `${bundleSource}\n//# debugId=${debugId}`;
}
/**
* Applies a set of heuristics to find the source map for a particular bundle.
*
* @returns the path to the bundle's source map or `undefined` if none could be found.
*/
async function determineSourceMapPathFromBundle(bundlePath, bundleSource, logger, resolveSourceMapHook) {
	const sourceMappingUrlMatch = bundleSource.match(/^\s*\/\/# sourceMappingURL=(.*)$/m);
	const sourceMappingUrl = sourceMappingUrlMatch ? sourceMappingUrlMatch[1] : void 0;
	const searchLocations = [];
	if (resolveSourceMapHook) {
		logger.debug(`Calling sourcemaps.resolveSourceMap(${JSON.stringify(bundlePath)}, ${JSON.stringify(sourceMappingUrl)})`);
		const customPath = await resolveSourceMapHook(bundlePath, sourceMappingUrl);
		logger.debug(`resolveSourceMap hook returned: ${JSON.stringify(customPath)}`);
		if (customPath) searchLocations.push(customPath);
	}
	if (sourceMappingUrl) {
		let parsedUrl;
		try {
			parsedUrl = new URL(sourceMappingUrl);
		} catch {}
		if (parsedUrl && parsedUrl.protocol === "file:") searchLocations.push(url.fileURLToPath(sourceMappingUrl));
		else if (parsedUrl) {} else if (path.isAbsolute(sourceMappingUrl)) searchLocations.push(path.normalize(sourceMappingUrl));
		else searchLocations.push(path.normalize(path.join(path.dirname(bundlePath), sourceMappingUrl)));
	}
	searchLocations.push(bundlePath + ".map");
	for (const searchLocation of searchLocations) try {
		await util.promisify(fs.access)(searchLocation);
		logger.debug(`Source map found for bundle \`${bundlePath}\`: \`${searchLocation}\``);
		return searchLocation;
	} catch (e) {}
	logger.debug(`Could not determine source map path for bundle \`${bundlePath}\` with sourceMappingURL=${sourceMappingUrl === void 0 ? "undefined" : `\`${sourceMappingUrl}\``} - Did you turn on source map generation in your bundler? (Attempted paths: ${searchLocations.map((e) => `\`${e}\``).join(", ")})`);
}
/**
* Reads a source map, injects debug ID fields, and writes the source map to the target path.
*/
async function prepareSourceMapForDebugIdUpload(sourceMapPath, targetPath, debugId, rewriteSourcesHook, logger) {
	let sourceMapFileContent;
	try {
		sourceMapFileContent = await util.promisify(fs.readFile)(sourceMapPath, { encoding: "utf8" });
	} catch (e) {
		logger.error(`Failed to read source map for debug ID upload: ${sourceMapPath}`, e);
		return;
	}
	let map;
	try {
		map = JSON.parse(sourceMapFileContent);
		map["debug_id"] = debugId;
		map["debugId"] = debugId;
	} catch (e) {
		logger.error(`Failed to parse source map for debug ID upload: ${sourceMapPath}`);
		return;
	}
	if (map["sources"] && Array.isArray(map["sources"])) {
		const mapDir = path.dirname(sourceMapPath);
		map["sources"] = map["sources"].map((source) => rewriteSourcesHook(source, map, { mapDir }));
	}
	try {
		await util.promisify(fs.writeFile)(targetPath, JSON.stringify(map), { encoding: "utf8" });
	} catch (e) {
		logger.error(`Failed to prepare source map for debug ID upload: ${sourceMapPath}`, e);
		return;
	}
}
const PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;
function defaultRewriteSourcesHook(source) {
	if (source.match(PROTOCOL_REGEX)) return source.replace(PROTOCOL_REGEX, "");
	else return path.relative(process.cwd(), path.normalize(source));
}
//#endregion
//#region src/build-plugin-manager.ts
const _deployedReleases = /* @__PURE__ */ new Set();
function createCliInstance(options) {
	return new SentryCli(null, {
		authToken: options.authToken,
		org: options.org,
		project: getProjects(options.project)?.[0],
		silent: options.silent,
		url: options.url,
		vcsRemote: options.release.vcsRemote,
		headers: {
			...options.telemetry ? getTraceData() : {},
			...options.headers
		}
	});
}
/**
* Creates a build plugin manager that exposes primitives for everything that a Sentry JavaScript SDK or build tooling may do during a build.
*
* The build plugin manager's behavior strongly depends on the options that are passed in.
*/
function createSentryBuildPluginManager(userOptions, bundlerPluginMetaContext) {
	const logger = createLogger({
		prefix: bundlerPluginMetaContext.loggerPrefix,
		silent: userOptions.silent ?? false,
		debug: userOptions.debug ?? false
	});
	try {
		const dotenvFile = fs$1.readFileSync(path$1.join(process.cwd(), ".env.sentry-build-plugin"), "utf-8");
		const dotenvResult = dotenv.parse(dotenvFile);
		Object.assign(process.env, dotenvResult);
		logger.info("Using environment variables configured in \".env.sentry-build-plugin\".");
	} catch (e) {
		if (typeof e === "object" && e && "code" in e && e.code !== "ENOENT") throw e;
	}
	const options = normalizeUserOptions(userOptions);
	if (options.disable) return {
		normalizedOptions: options,
		logger,
		bundleSizeOptimizationReplacementValues: {},
		telemetry: { emitBundlerPluginExecutionSignal: async () => {} },
		bundleMetadata: {},
		createRelease: async () => {},
		uploadSourcemaps: async () => {},
		deleteArtifacts: async () => {},
		createDependencyOnBuildArtifacts: () => () => {},
		injectDebugIds: async () => {}
	};
	const shouldSendTelemetry = allowedToSendTelemetry(options);
	const { sentryScope, sentryClient } = createSentryInstance(options, shouldSendTelemetry, bundlerPluginMetaContext.buildTool, bundlerPluginMetaContext.buildToolMajorVersion);
	const { release, environment = DEFAULT_ENVIRONMENT } = sentryClient.getOptions();
	const sentrySession = makeSession({
		release,
		environment
	});
	sentryScope.setSession(sentrySession);
	sentryClient.captureSession(sentrySession);
	let sessionHasEnded = false;
	function endSession() {
		if (sessionHasEnded) return;
		closeSession(sentrySession);
		sentryClient.captureSession(sentrySession);
		sessionHasEnded = true;
	}
	process.on("beforeExit", () => {
		endSession();
	});
	process.env["SENTRY_PIPELINE"] = `${bundlerPluginMetaContext.buildTool}-plugin/${LIB_VERSION}`;
	if (options.debug && !process.env["SENTRY_LOG_LEVEL"]) process.env["SENTRY_LOG_LEVEL"] = "debug";
	const isDevMode = process.env["NODE_ENV"] === "development";
	/**
	* Handles errors caught and emitted in various areas of the plugin.
	*
	* Also sets the sentry session status according to the error handling.
	*
	* If users specify their custom `errorHandler` we'll leave the decision to throw
	* or continue up to them. By default, @param throwByDefault controls if the plugin
	* should throw an error (which causes a build fail in most bundlers) or continue.
	*/
	function handleRecoverableError(unknownError, throwByDefault) {
		sentrySession.status = "abnormal";
		try {
			if (options.errorHandler) try {
				if (unknownError instanceof Error) options.errorHandler(unknownError);
				else options.errorHandler(/* @__PURE__ */ new Error("An unknown error occurred"));
			} catch (e) {
				sentrySession.status = "crashed";
				throw e;
			}
			else {
				sentrySession.status = "crashed";
				if (throwByDefault) throw unknownError;
				logger.error("An error occurred. Couldn't finish all operations:", unknownError);
			}
		} finally {
			endSession();
		}
	}
	if (!validateOptions(options, logger)) handleRecoverableError(/* @__PURE__ */ new Error("Options were not set correctly. See output above for more details."), true);
	const dependenciesOnBuildArtifacts = /* @__PURE__ */ new Set();
	const buildArtifactsDependencySubscribers = [];
	function notifyBuildArtifactDependencySubscribers() {
		buildArtifactsDependencySubscribers.forEach((subscriber) => {
			subscriber();
		});
	}
	function createDependencyOnBuildArtifacts() {
		const dependencyIdentifier = Symbol();
		dependenciesOnBuildArtifacts.add(dependencyIdentifier);
		return function freeDependencyOnBuildArtifacts() {
			dependenciesOnBuildArtifacts.delete(dependencyIdentifier);
			notifyBuildArtifactDependencySubscribers();
		};
	}
	/**
	* Returns a Promise that resolves when all the currently active dependencies are freed again.
	*
	* It is very important that this function is called as late as possible before wanting to await the Promise to give
	* the dependency producers as much time as possible to register themselves.
	*/
	function waitUntilBuildArtifactDependenciesAreFreed() {
		return new Promise((resolve) => {
			buildArtifactsDependencySubscribers.push(() => {
				if (dependenciesOnBuildArtifacts.size === 0) resolve();
			});
			if (dependenciesOnBuildArtifacts.size === 0) resolve();
		});
	}
	const bundleSizeOptimizationReplacementValues = {};
	if (options.bundleSizeOptimizations) {
		const { bundleSizeOptimizations } = options;
		if (bundleSizeOptimizations.excludeDebugStatements) bundleSizeOptimizationReplacementValues["__SENTRY_DEBUG__"] = false;
		if (bundleSizeOptimizations.excludeTracing) bundleSizeOptimizationReplacementValues["__SENTRY_TRACING__"] = false;
		if (bundleSizeOptimizations.excludeReplayCanvas) bundleSizeOptimizationReplacementValues["__RRWEB_EXCLUDE_CANVAS__"] = true;
		if (bundleSizeOptimizations.excludeReplayIframe) bundleSizeOptimizationReplacementValues["__RRWEB_EXCLUDE_IFRAME__"] = true;
		if (bundleSizeOptimizations.excludeReplayShadowDom) bundleSizeOptimizationReplacementValues["__RRWEB_EXCLUDE_SHADOW_DOM__"] = true;
		if (bundleSizeOptimizations.excludeReplayWorker) bundleSizeOptimizationReplacementValues["__SENTRY_EXCLUDE_REPLAY_WORKER__"] = true;
	}
	let bundleMetadata = {};
	if (options.moduleMetadata || options.applicationKey) {
		if (options.applicationKey) bundleMetadata[`_sentryBundlerPluginAppKey:${options.applicationKey}`] = true;
		if (typeof options.moduleMetadata === "function") {
			const args = {
				org: options.org,
				project: getProjects(options.project)?.[0],
				projects: getProjects(options.project),
				release: options.release.name
			};
			bundleMetadata = {
				...bundleMetadata,
				...options.moduleMetadata(args)
			};
		} else bundleMetadata = {
			...bundleMetadata,
			...options.moduleMetadata
		};
	}
	return {
		logger,
		normalizedOptions: options,
		bundleSizeOptimizationReplacementValues,
		bundleMetadata,
		telemetry: { async emitBundlerPluginExecutionSignal() {
			if (await shouldSendTelemetry) {
				logger.info("Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.");
				startSpan({
					name: "Sentry Bundler Plugin execution",
					scope: sentryScope
				}, () => {});
				await safeFlushTelemetry(sentryClient);
			}
		} },
		async createRelease() {
			if (!options.release.name) {
				logger.debug("No release name provided. Will not create release. Please set the `release.name` option to identify your release.");
				return;
			} else if (isDevMode) {
				logger.debug("Running in development mode. Will not create release.");
				return;
			} else if (!options.authToken) {
				logger.warn("No auth token provided. Will not create release. Please set the `authToken` option. You can find information on how to generate a Sentry auth token here: https://docs.sentry.io/api/auth/" + getTurborepoEnvPassthroughWarning("SENTRY_AUTH_TOKEN"));
				return;
			} else if (!options.org && !options.authToken.startsWith("sntrys_")) {
				logger.warn("No organization slug provided. Will not create release. Please set the `org` option to your Sentry organization slug." + getTurborepoEnvPassthroughWarning("SENTRY_ORG"));
				return;
			} else if (!options.project || Array.isArray(options.project) && options.project.length === 0) {
				logger.warn("No project provided. Will not create release. Please set the `project` option to your Sentry project slug." + getTurborepoEnvPassthroughWarning("SENTRY_PROJECT"));
				return;
			}
			const freeWriteBundleInvocationDependencyOnSourcemapFiles = createDependencyOnBuildArtifacts();
			try {
				const cliInstance = createCliInstance(options);
				if (options.release.create) {
					const releaseOutput = await cliInstance.releases.new(options.release.name);
					logger.debug("Release created:", releaseOutput);
				}
				if (options.release.uploadLegacySourcemaps) {
					const normalizedInclude = arrayify(options.release.uploadLegacySourcemaps).map((includeItem) => typeof includeItem === "string" ? { paths: [includeItem] } : includeItem).map((includeEntry) => ({
						...includeEntry,
						validate: includeEntry.validate ?? false,
						ext: includeEntry.ext ? includeEntry.ext.map((extension) => `.${extension.replace(/^\./, "")}`) : [
							".js",
							".map",
							".jsbundle",
							".bundle"
						],
						ignore: includeEntry.ignore ? arrayify(includeEntry.ignore) : void 0
					}));
					await cliInstance.releases.uploadSourceMaps(options.release.name, {
						include: normalizedInclude,
						dist: options.release.dist,
						projects: getProjects(options.project),
						live: "rejectOnError"
					});
				}
				if (options.release.setCommits !== false) try {
					await cliInstance.releases.setCommits(options.release.name, options.release.setCommits);
				} catch (e) {
					if (options.release.setCommits && "shouldNotThrowOnFailure" in options.release.setCommits && options.release.setCommits.shouldNotThrowOnFailure) logger.debug("An error occurred setting commits on release (this message can be ignored unless you commits on release are desired):", e);
					else throw e;
				}
				if (options.release.finalize) await cliInstance.releases.finalize(options.release.name);
				if (options.release.deploy && !_deployedReleases.has(options.release.name)) {
					await cliInstance.releases.newDeploy(options.release.name, options.release.deploy);
					_deployedReleases.add(options.release.name);
				}
			} catch (e) {
				sentryScope.captureException("Error in \"releaseManagementPlugin\" writeBundle hook");
				await safeFlushTelemetry(sentryClient);
				handleRecoverableError(e, false);
			} finally {
				freeWriteBundleInvocationDependencyOnSourcemapFiles();
			}
		},
		async injectDebugIds(buildArtifactPaths) {
			await startSpan({
				name: "inject-debug-ids",
				scope: sentryScope,
				forceTransaction: true
			}, async () => {
				try {
					await createCliInstance(options).execute([
						"sourcemaps",
						"inject",
						...serializeIgnoreOptions(options.sourcemaps?.ignore),
						...buildArtifactPaths
					], options.debug ? "rejectOnError" : false);
				} catch (e) {
					sentryScope.captureException("Error in \"debugIdInjectionPlugin\" writeBundle hook");
					handleRecoverableError(e, false);
				} finally {
					await safeFlushTelemetry(sentryClient);
				}
			});
		},
		async uploadSourcemaps(buildArtifactPaths, opts) {
			if (!canUploadSourceMaps(options, logger, isDevMode)) return;
			const assets = options.sourcemaps?.assets;
			if (Array.isArray(assets) && assets.length === 0) {
				logger.debug("Empty `sourcemaps.assets` option provided. Will not upload sourcemaps with debug ID.");
				return;
			}
			await startSpan({
				name: "debug-id-sourcemap-upload",
				scope: sentryScope,
				forceTransaction: true
			}, async () => {
				const shouldPrepare = opts?.prepareArtifacts ?? true;
				let folderToCleanUp;
				const freeUploadDependencyOnBuildArtifacts = createDependencyOnBuildArtifacts();
				try {
					if (!shouldPrepare) {
						let pathsToUpload;
						if (assets) {
							pathsToUpload = Array.isArray(assets) ? assets : [assets];
							logger.debug(`Direct upload mode: passing user-provided assets directly to CLI: ${pathsToUpload.join(", ")}`);
						} else pathsToUpload = buildArtifactPaths;
						const ignorePaths = options.sourcemaps?.ignore ? Array.isArray(options.sourcemaps?.ignore) ? options.sourcemaps?.ignore : [options.sourcemaps?.ignore] : [];
						await startSpan({
							name: "upload",
							scope: sentryScope
						}, async () => {
							await createCliInstance(options).releases.uploadSourceMaps(options.release.name ?? "undefined", {
								include: [{
									paths: pathsToUpload,
									rewrite: true,
									dist: options.release.dist
								}],
								ignore: ignorePaths,
								projects: getProjects(options.project),
								live: "rejectOnError"
							});
						});
						logger.info("Successfully uploaded source maps to Sentry");
					} else {
						let globAssets;
						if (assets) globAssets = assets;
						else {
							logger.debug("No `sourcemaps.assets` option provided, falling back to uploading detected build artifacts.");
							globAssets = buildArtifactPaths;
						}
						const debugIdChunkFilePaths = (await startSpan({
							name: "glob",
							scope: sentryScope
						}, async () => await globFiles(globAssets, { ignore: options.sourcemaps?.ignore }))).filter((debugIdChunkFilePath) => {
							return !!stripQueryAndHashFromPath(debugIdChunkFilePath).match(/\.(js|mjs|cjs)$/);
						});
						debugIdChunkFilePaths.sort();
						if (debugIdChunkFilePaths.length === 0) logger.warn("Didn't find any matching sources for debug ID upload. Please check the `sourcemaps.assets` option.");
						else {
							const tmpUploadFolder = await startSpan({
								name: "mkdtemp",
								scope: sentryScope
							}, async () => {
								return process.env?.["SENTRY_TEST_OVERRIDE_TEMP_DIR"] || await fs$1.promises.mkdtemp(path$1.join(os$1.tmpdir(), "sentry-bundler-plugin-upload-"));
							});
							folderToCleanUp = tmpUploadFolder;
							await startSpan({
								name: "prepare-bundles",
								scope: sentryScope
							}, async (prepBundlesSpan) => {
								const preparationTasks = debugIdChunkFilePaths.map((chunkFilePath, chunkIndex) => async () => {
									await prepareBundleForDebugIdUpload(chunkFilePath, tmpUploadFolder, chunkIndex, logger, options.sourcemaps?.rewriteSources ?? defaultRewriteSourcesHook, options.sourcemaps?.resolveSourceMap);
								});
								const workers = [];
								const worker = async () => {
									while (preparationTasks.length > 0) {
										const task = preparationTasks.shift();
										if (task) await task();
									}
								};
								for (let workerIndex = 0; workerIndex < 16; workerIndex++) workers.push(worker());
								await Promise.all(workers);
								const files = await fs$1.promises.readdir(tmpUploadFolder);
								const stats = files.map((file) => fs$1.promises.stat(path$1.join(tmpUploadFolder, file)));
								const uploadSize = (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
								setMeasurement("files", files.length, "none", prepBundlesSpan);
								setMeasurement("upload_size", uploadSize, "byte", prepBundlesSpan);
								await startSpan({
									name: "upload",
									scope: sentryScope
								}, async () => {
									await createCliInstance(options).releases.uploadSourceMaps(options.release.name ?? "undefined", {
										include: [{
											paths: [tmpUploadFolder],
											rewrite: false,
											dist: options.release.dist
										}],
										projects: getProjects(options.project),
										live: "rejectOnError"
									});
								});
							});
							logger.info("Successfully uploaded source maps to Sentry");
						}
					}
				} catch (e) {
					sentryScope.captureException("Error in \"debugIdUploadPlugin\" writeBundle hook");
					handleRecoverableError(e, false);
				} finally {
					if (folderToCleanUp && !process.env?.["SENTRY_TEST_OVERRIDE_TEMP_DIR"]) {
						logger.debug("Cleaning up temporary files...");
						startSpan({
							name: "cleanup",
							scope: sentryScope
						}, async () => {
							if (folderToCleanUp) {
								await fs$1.promises.rm(folderToCleanUp, {
									recursive: true,
									force: true
								});
								logger.debug(`Temporary folder deleted: ${folderToCleanUp}`);
							}
						});
					}
					logger.debug("Freeing upload dependencies...");
					freeUploadDependencyOnBuildArtifacts();
					logger.debug("Flushing telemetry data...");
					await safeFlushTelemetry(sentryClient);
					logger.debug("Telemetry flushed. Plugin upload process complete.");
				}
			});
		},
		async deleteArtifacts() {
			try {
				const filesToDelete = await options.sourcemaps?.filesToDeleteAfterUpload;
				if (filesToDelete !== void 0) {
					const filePathsToDelete = await globFiles(filesToDelete);
					logger.debug("Waiting for dependencies on generated files to be freed before deleting...");
					await waitUntilBuildArtifactDependenciesAreFreed();
					filePathsToDelete.forEach((filePathToDelete) => {
						logger.debug(`Deleting asset after upload: ${filePathToDelete}`);
					});
					await Promise.all(filePathsToDelete.map((filePathToDelete) => fs$1.promises.rm(filePathToDelete, { force: true }).catch((e) => {
						logger.debug(`An error occurred while attempting to delete asset: ${filePathToDelete}`, e);
					})));
				}
			} catch (e) {
				sentryScope.captureException("Error in \"sentry-file-deletion-plugin\" buildEnd hook");
				await safeFlushTelemetry(sentryClient);
				handleRecoverableError(e, true);
			}
		},
		createDependencyOnBuildArtifacts
	};
}
function canUploadSourceMaps(options, logger, isDevMode) {
	if (options.sourcemaps?.disable) {
		logger.debug("Source map upload was disabled. Will not upload sourcemaps using debug ID process.");
		return false;
	}
	if (isDevMode) {
		logger.debug("Running in development mode. Will not upload sourcemaps.");
		return false;
	}
	if (!options.authToken) {
		logger.warn("No auth token provided. Will not upload source maps. Please set the `authToken` option. You can find information on how to generate a Sentry auth token here: https://docs.sentry.io/api/auth/" + getTurborepoEnvPassthroughWarning("SENTRY_AUTH_TOKEN"));
		return false;
	}
	if (!options.org && !options.authToken.startsWith("sntrys_")) {
		logger.warn("No org provided. Will not upload source maps. Please set the `org` option to your Sentry organization slug." + getTurborepoEnvPassthroughWarning("SENTRY_ORG"));
		return false;
	}
	if (!getProjects(options.project)?.[0]) {
		logger.warn("No project provided. Will not upload source maps. Please set the `project` option to your Sentry project slug." + getTurborepoEnvPassthroughWarning("SENTRY_PROJECT"));
		return false;
	}
	return true;
}
//#endregion
//#region src/index.ts
/**
* Determines whether the Sentry CLI binary is in its expected location.
* This function is useful since `@sentry/cli` installs the binary via a post-install
* script and post-install scripts may not always run. E.g. with `npm i --ignore-scripts`.
*/
function sentryCliBinaryExists() {
	return fs$1.existsSync(SentryCli.getPath());
}
const COMMENT_USE_STRICT_REGEX = /^(?:\s*|\/\*(?:.|\r|\n)*?\*\/|\/\/.*[\n\r])*(?:"[^"]*";|'[^']*';)?/;
/**
* Checks if a file is a JavaScript file based on its extension.
* Handles query strings and hashes in the filename.
*/
function isJsFile(fileName) {
	const cleanFileName = stripQueryAndHashFromPath(fileName);
	return [
		".js",
		".mjs",
		".cjs"
	].some((ext) => cleanFileName.endsWith(ext));
}
/**
* Checks if a chunk should be skipped for code injection
*
* This is necessary to handle Vite's MPA (multi-page application) mode where
* HTML entry points create "facade" chunks that should not contain injected code.
* See: https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/829
*
* However, in SPA mode, the main bundle also has an HTML facade but contains
* substantial application code. We should NOT skip injection for these bundles.
*
* @param code - The chunk's code content
* @param facadeModuleId - The facade module ID (if any) - HTML files create facade chunks
* @returns true if the chunk should be skipped
*/
function shouldSkipCodeInjection(code, facadeModuleId) {
	if (code.trim().length === 0) return true;
	if (facadeModuleId && stripQueryAndHashFromPath(facadeModuleId).endsWith(".html")) return containsOnlyImports(code);
	return false;
}
function createComponentNameAnnotateHooks(ignoredComponents, injectIntoHtml) {
	return { async transform(code, id) {
		const idWithoutQueryAndHash = stripQueryAndHashFromPath(id);
		if (idWithoutQueryAndHash.match(/\\node_modules\\|\/node_modules\//)) return null;
		if (![".jsx", ".tsx"].some((ending) => idWithoutQueryAndHash.endsWith(ending))) return null;
		const parserPlugins = [];
		if (idWithoutQueryAndHash.endsWith(".jsx")) parserPlugins.push("jsx");
		else if (idWithoutQueryAndHash.endsWith(".tsx")) parserPlugins.push("jsx", "typescript");
		const plugin = injectIntoHtml ? experimentalComponentNameAnnotatePlugin : componentNameAnnotatePlugin;
		try {
			const result = await transformAsync(code, {
				plugins: [[plugin, { ignoredComponents }]],
				filename: id,
				parserOpts: {
					sourceType: "module",
					allowAwaitOutsideFunction: true,
					plugins: parserPlugins
				},
				generatorOpts: { decoratorsBeforeExport: true },
				sourceMaps: true
			});
			return {
				code: result?.code ?? code,
				map: result?.map
			};
		} catch (e) {
			logger.error(`Failed to apply react annotate plugin`, e);
		}
		return { code };
	} };
}
function getDebugIdSnippet(debugId) {
	return new CodeInjection(`var n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="${debugId}",e._sentryDebugIdIdentifier="sentry-dbid-${debugId}");`);
}
//#endregion
export { COMMENT_USE_STRICT_REGEX, CodeInjection, createComponentNameAnnotateHooks, createDebugIdUploadFunction, createSentryBuildPluginManager, generateModuleMetadataInjectorCode, generateReleaseInjectorCode, getDebugIdSnippet, globFiles, isJsFile, replaceBooleanFlagsInCode, sentryCliBinaryExists, shouldSkipCodeInjection, stringToUUID };

//# sourceMappingURL=index.mjs.map