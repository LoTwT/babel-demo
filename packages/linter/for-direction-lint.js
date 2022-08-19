const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const forDirectionLintPlugin = require("./plugins/for-direction-lint-plugin")

const sourceCode = `
for (var i = 0; i < 10; i++) {
}

for (var i = 10; i >= 0; i--) {
}
for (var i = 0; i < 10; i--) {
}

for (var i = 10; i >= 0; i++) {
}
`

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
})

const {} = transformFromAstSync(ast, sourceCode, {
  plugins: [forDirectionLintPlugin],
  filename: "input.js",
})
