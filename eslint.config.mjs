import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

const copyAttributes = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "placeholder",
  "title",
]);

const noHardcodedCopy = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      copy: "User-facing copy belongs in the content file.",
    },
  },
  create(context) {
    return {
      JSXText(node) {
        report(context, node, node.value);
      },
      JSXAttribute(node) {
        if (!copyAttributes.has(attributeName(node))) {
          return;
        }
        if (node.value?.type === "Literal") {
          report(context, node.value, node.value.value);
        }
      },
      JSXExpressionContainer(node) {
        const parent = node.parent;
        if (!parent) {
          return;
        }
        if (parent.type === "JSXAttribute") {
          if (copyAttributes.has(attributeName(parent))) {
            visit(context, node.expression);
          }
          return;
        }
        if (parent.type === "JSXElement" || parent.type === "JSXFragment") {
          visit(context, node.expression);
        }
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.strict,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".private/**",
  ]),
  {
    files: ["src/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    plugins: {
      kyc: { rules: { "no-hardcoded-copy": noHardcodedCopy } },
    },
    rules: { "kyc/no-hardcoded-copy": "error" },
  },
]);

function attributeName(node) {
  return node.name?.type === "JSXIdentifier" ? node.name.name : "";
}

function visit(context, expression) {
  if (!expression) {
    return;
  }
  if (expression.type === "Literal") {
    report(context, expression, expression.value);
    return;
  }
  if (expression.type === "TemplateLiteral") {
    for (const quasi of expression.quasis) {
      report(context, quasi, quasi.value.cooked ?? "");
    }
    return;
  }
  if (expression.type === "ConditionalExpression") {
    visit(context, expression.consequent);
    visit(context, expression.alternate);
    return;
  }
  if (expression.type === "LogicalExpression") {
    visit(context, expression.left);
    visit(context, expression.right);
  }
}

function report(context, node, value) {
  if (typeof value === "string" && /[A-Za-z]/.test(value)) {
    context.report({ node, messageId: "copy" });
  }
}

export default eslintConfig;
