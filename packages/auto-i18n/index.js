const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoI18nPlugin = require("./auto-i18n-plugin")
const fs = require("node:fs")
const path = require("node:path")

const source = fs.readFileSync(path.join(__dirname, "./source.js"), {
  encoding: "utf-8",
})

const ast = parser.parse(source, {
  sourceType: "unambiguous",
  plugins: ["jsx"],
})

const { code } = transformFromAstSync(ast, source, {
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
