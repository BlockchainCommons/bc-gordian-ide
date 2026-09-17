import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf-8"),
) as { version: string };

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-09-11",
  runtimeConfig: {
    public: {
      appVersion: pkg.version,
    },
  },
  modules: ["@nuxt/eslint", "@nuxt/ui", "@nuxthub/core", "@nuxtjs/seo", "nuxt-gtag"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  vite: {
    build: {
      // The default (oxc) minifier drops the calls that install the
      // @blockchaincommons/envelope/all methods on Envelope.prototype, which
      // leaves `envelope.format()` and friends undefined in the browser.
      minify: "esbuild",
    },
    optimizeDeps: {
      include: ["@paulmillr/qr", "@paulmillr/qr/decode.js", "@paulmillr/qr/dom.js"],
    },
  },
  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      meta: [{ name: "theme-color", content: "#FF2670" }],
    },
  },
  site: {
    url: "https://bcts.dev",
    name: "BCTS IDE - Blockchain Commons TypeScript",
    description:
      "Interactive playground for exploring dCBOR encoding, Uniform Resources, and Gordian Envelope visualization. Parse, encode, and convert between formats with live examples.",
    defaultLocale: "en",
  },
  ogImage: {
    zeroRuntime: true,
  },
  sitemap: {
    urls: [
      // API documentation of each package
      "https://blockchaincommons.github.io/bc-components-ts/",
      "https://blockchaincommons.github.io/bc-crypto-ts/",
      "https://blockchaincommons.github.io/bc-dcbor-ts/",
      "https://blockchaincommons.github.io/bc-dcbor-parse-ts/",
      "https://blockchaincommons.github.io/bc-dcbor-pattern-ts/",
      "https://blockchaincommons.github.io/bc-envelope-ts/",
      "https://blockchaincommons.github.io/bc-envelope-pattern-ts/",
      "https://blockchaincommons.github.io/bc-gstp-ts/",
      "https://blockchaincommons.github.io/bc-known-values-ts/",
      "https://blockchaincommons.github.io/bc-lifehash-ts/",
      "https://blockchaincommons.github.io/bc-mur-ts/",
      "https://blockchaincommons.github.io/bc-provenance-mark-ts/",
      "https://blockchaincommons.github.io/bc-rand-ts/",
      "https://blockchaincommons.github.io/bc-shamir-ts/",
      "https://blockchaincommons.github.io/bc-sskr-ts/",
      "https://blockchaincommons.github.io/bc-tags-ts/",
      "https://blockchaincommons.github.io/bc-ur-ts/",
      "https://blockchaincommons.github.io/bc-xid-ts/",
    ],
  },
  routeRules: {
    "/": { prerender: true },
  },
  hub: {
    kv: true,
  },
  gtag: {
    id: "G-3SNT76DSC3",
  },
  nitro: {
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    storage: {
      cache: {
        driver: "cloudflare-kv-binding",
        binding: "CACHE",
      },
    },
  },
});
