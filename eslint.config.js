import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

const nodeGlobals = {
  process: "readonly",
  console: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
};

const unsafeRequestPath =
  ":not(Literal, TemplateLiteral[expressions.length=0], TaggedTemplateExpression[tag.name='encodePath'], ConditionalExpression[consequent.type='Literal'][alternate.type='Literal'])";
const unsafeRequestPathMessage =
  "A request path is a static string or encodePath`...`, so each id stays one segment.";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ["**/dist/", "**/node_modules/", "**/.tsc-out/"],
  },
  {
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
    },
  },
  {
    files: ["packages/*/src/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `ObjectExpression > Property:matches([key.name='path'], [key.value='path']) > .value${unsafeRequestPath}`,
          message: unsafeRequestPathMessage,
        },
        {
          selector: `AssignmentExpression:matches([left.property.name='path'], [left.property.value='path']) > .right${unsafeRequestPath}`,
          message: unsafeRequestPathMessage,
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
);
