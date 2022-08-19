const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoDocumentPlugin = require("./auto-document-plugin")
const fs = require("node:fs")
const path = require("node:path")

const sourceCode = fs.readFileSync(path.join(__dirname, "./sourceCode.ts"), {
  encoding: "utf-8",
})

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      autoDocumentPlugin,
      {
        outputDir: path.resolve(__dirname, "./docs"),
        format: "markdown",
      },
    ],
  ],
})

console.log(code)
