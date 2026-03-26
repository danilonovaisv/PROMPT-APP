import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { TextDecoder, TextEncoder } from "util";

// Polyfill structuredClone for older Node.js versions and test environments
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Polyfill Blob.prototype.text for JSDOM
if (typeof Blob.prototype.text === "undefined") {
  Blob.prototype.text = function () {
    return this.arrayBuffer().then(buffer => global.TextDecoder ? new global.TextDecoder().decode(buffer) : "");
  };
}

// Mock matchMedia for components that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as unknown as Storage;
