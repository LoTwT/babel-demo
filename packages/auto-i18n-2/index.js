const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoI18nPlugin = require("./auto-i18n-plugin.js")
const fs = require("node:fs")
const path = require("node:path")

const sourceCode = fs.readFileSync(path.join(__dirname, "./sourceCode.js"), {
  encoding: "utf-8",
})

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      autoI18nPlugin,
      {
        outputDir: path.resolve(__dirname, "./output"),
      },
    ],
  ],
})

console.log(code)
