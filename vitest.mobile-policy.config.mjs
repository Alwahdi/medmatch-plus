import ts from "typescript";

// Pure mobile policies can be tested without installing the native Expo runtime.
export default {
  oxc: false,
  plugins: [{
    name: "standalone-mobile-policy",
    enforce: "pre",
    transform(source, id) {
      if (!id.includes("/mobile/src/lib/registration") || !id.endsWith(".ts")) return;
      return {
        code: ts.transpileModule(source, {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
        }).outputText,
        map: null,
      };
    },
  }],
  test: { include: ["mobile/src/lib/registration.test.ts"] },
};