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

const paletteUtilities = [
  "bg",
  "text",
  "border(?:-[trblxy])?",
  "outline",
  "ring(?:-offset)?",
  "fill",
  "stroke",
  "accent",
  "caret",
  "divide",
  "from",
  "via",
  "to",
  "decoration",
  "shadow",
  "placeholder",
].join("|");

const paletteColours =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white";

const rawColourPatterns = [
  ["hex", /#[0-9A-Fa-f]{3,8}\b/g],
  ["rgb", /\brgba?\s*\(/g],
  [
    "palette",
    new RegExp(
      `(?:^|[^A-Za-z0-9-])(?:[A-Za-z0-9-]+:)*(?:${paletteUtilities})-(?:${paletteColours})(?:-\\d{2,3})?(?:/\\d{1,3})?(?![A-Za-z0-9-])`,
      "g",
    ),
  ],
];

const noRawColour = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      hex: "Use a design token instead of a raw hex colour.",
      rgb: "Use a design token instead of an rgb() colour.",
      palette: "Use a design token instead of a Tailwind palette colour.",
    },
  },
  create(context) {
    return {
      Program() {
        const source = context.sourceCode.getText();
        for (const [messageId, pattern] of rawColourPatterns) {
          for (const match of source.matchAll(pattern)) {
            context.report({
              loc: context.sourceCode.getLocFromIndex(match.index ?? 0),
              messageId,
            });
          }
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
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      kyc: {
        rules: {
          "no-hardcoded-copy": noHardcodedCopy,
          "no-raw-colour": noRawColour,
        },
      },
    },
    rules: { "kyc/no-raw-colour": "error" },
  },
  {
    files: ["src/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
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
