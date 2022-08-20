const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const overrideCheckerPlugin = require("./plugins/override-checker-plugin")
const fs = require("node:fs")
const path = require("node:path")

const sourceCode = fs.readFileSync(path.join(__dirname, "./sourceCode.js"), {
  encoding: "utf-8",
})

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [overrideCheckerPlugin],
})
