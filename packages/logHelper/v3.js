const { transformFileSync } = require("@babel/core")
const logHelperPlugin = require("./plugin/logHelperPlugin")
const path = require("path")

const { code } = transformFileSync(path.join(__dirname, "./sourceCode.js"), {
  plugins: [logHelperPlugin],
  parserOpts: {
    sourceType: "unambiguous",
    plugins: ["jsx"],
  },
})

console.log(code)
