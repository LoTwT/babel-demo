const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoDocumentPlugin = require("./auto-document-plugin")
const fs = require("node:fs")
const path = require("node:path")

const source = fs.readFileSync(path.join(__dirname, "./source.ts"), {
  encoding: "utf-8",
})

const ast = parser.parse(source, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
})

const {} = transformFromAstSync(ast, source, {
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
