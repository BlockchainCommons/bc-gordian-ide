// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    // Prettier writes void elements as `<input />`; accept that form.
    "vue/html-self-closing": [
      "warn",
      {
        html: { void: "always", normal: "always", component: "always" },
        svg: "always",
        math: "always",
      },
    ],
  },
});
