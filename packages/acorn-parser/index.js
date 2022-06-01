const acorn = require("acorn")

const Parser = acorn.Parser
const TokenType = acorn.TokenType

Parser.acorn.keywordTypes["guang"] = new TokenType("guang", {
  keyword: "guang",
})

function wordsRegexp(words) {
  return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
}

const guangKeyword = function (Parser) {
  return class extends Parser {
    parse(program) {
      let newKeywords =
        "break case catch continue debugger default do else finally for function if return switch throw try const while with null true false instanceof typeof void delete new in this const class extends export import super"
      newKeywords += " guang"
      this.keywords = new RegExp("^(?:" + newKeywords.replace(/ /g, "|") + ")$")
      return super.parse(program)
    }

    parseStatement(context, topLevel, exports) {
      const starttype = this.type

      if (starttype == Parser.acorn.keywordTypes["guang"]) {
        const node = this.startNode()
        return this.parseGuangStatement(node)
      } else {
        return super.parseStatement(context, topLevel, exports)
      }
    }

    parseGuangStatement(node) {
      this.next()
      return this.finishNode({ value: "guang" }, "GuangStatement")
    }
  }
}
const newParser = Parser.extend(guangKeyword)

const program = `
    guang
    const a = 1
`

const ast = newParser.parse(program)
console.log(ast)
