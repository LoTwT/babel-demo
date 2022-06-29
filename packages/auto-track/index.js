const { transformFromAstSync } = require("@babel/core")
const parser = require("@babel/parser")
const autoTrackPlugin = require("./auto-track-plugin")
const fs = require("node:fs")
const path = require("node:path")

const source = fs.readFileSync(path.join(__dirname, "./source.js"), {
  encoding: "utf-8",
})

const ast = parser.parse(source, {
  sourceType: "unambiguous",
})

const { code } = transformFromAstSync(ast, source, {
  plugins: [
    [
      autoTrackPlugin,
      {
        trackerPath: "tracker",
      },
    ],
  ],
})

console.log(code)
