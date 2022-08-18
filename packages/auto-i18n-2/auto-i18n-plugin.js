const { declare } = require("@babel/helper-plugin-utils")
const fse = require("fs-extra")
const path = require("node:path")
const generate = require("@babel/generator").default

let intlIndex = 0

// 生成 intl source 文件的唯一 key
function nextIntlKey() {
  ++intlIndex
  return `intl${intlIndex}`
}

const autoI18nPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  if (!options.outputDir) {
    throw new Error("outputDir is empty")
  }

  // 生成指定替换节点
  function getReplaceExpression(path, value, intlUid) {
    const expressionParams = path.isTemplateLiteral()
      ? path.node.expressions.map((item) => generate(item).code)
      : null

    let replaceExpression = api.template.ast(
      `${intlUid}.t("${value}"${
        expressionParams ? "," + expressionParams.join(",") : ""
      })`,
    ).expression

    // 要判断是否在 jsxAttribute 下，如果是，需要包裹在 jsxExpressionContainer 节点中 ( 即 {} )
    // 如果是模板字符串字面量 ( TemplateLiteral ) ，还要把 expressions 作为参数传入
    if (
      path.findParent((p) => p.isJSXAttribute()) &&
      !path.findParent((p) => p.isJSXExpressionContainer())
    ) {
      replaceExpression = api.types.jsxExpressionContainer(replaceExpression)
    }

    return replaceExpression
  }

  // 收集要替换的 key value，保存到 file 中
  // 在 pre 阶段初始化
  // 在 post 阶段取出，用于生成 resource 文件，生成位置通过插件的 outputDir 传入
  function save(file, key, value) {
    const allText = file.get("allText")
    allText.push({
      key,
      value,
    })
    file.set("allText", allText)
  }

  return {
    pre(file) {
      file.set("allText", [])
    },
    visitor: {
      Program: {
        // 文件进入时判断是否导入国际化相关的库
        enter(path, state) {
          let imported

          path.traverse({
            ImportDeclaration(p) {
              const source = p.node.source.value
              // 如果导入了，打标记
              if (source === "intl") imported = true
            },
          })

          // 未导入，添加导入
          if (!imported) {
            const uid = path.scope.generateUid("intl")
            const importAst = api.template.ast(`import ${uid} from "intl"`)
            path.node.body.unshift(importAst)
            state.intlUid = uid
          }

          // 把打了 i18n-disable 标记注释的字符串和模板字符串打标记
          // 跳过处理打了标记的节点
          path.traverse({
            "StringLiteral|TemplateLiteral"(path) {
              if (path.node.leadingComments) {
                path.node.leadingComments = path.node.leadingComments.filter(
                  (comment) => {
                    if (comment.value.includes("i18n-disable")) {
                      path.node.skipTransform = true
                      return false
                    }
                    return true
                  },
                )
              }

              if (path.findParent((p) => p.isImportDeclaration())) {
                path.node.skipTransform = true
              }
            },
          })
        },
      },
      // StringLiteral 、 TemplateLiteral
      // 用 state.intlUid + ".t" 的函数调用语句替换原节点
      // 替换完后，要用 path.skip 跳过新生成节点的处理，防止死循环
      StringLiteral(path, state) {
        if (path.node.skipTransform) return

        const key = nextIntlKey()
        save(state.file, key, path.node.value)

        const replaceExpression = getReplaceExpression(path, key, state.intlUid)
        path.replaceWith(replaceExpression)
        path.skip()
      },
      TemplateLiteral(path, state) {
        if (path.node.skipTransform) return

        const value = path
          .get("quasis")
          .map((item) => item.node.value.raw)
          .join("{placeholder}")

        if (value) {
          const key = nextIntlKey()

          save(state.file, key, value)

          const replaceExpression = getReplaceExpression(
            path,
            key,
            state.intlUid,
          )
          path.replaceWith(replaceExpression)
          path.skip()
        }
      },
    },
    post(file) {
      const allText = file.get("allText")
      const intlData = allText.reduce((obj, item) => {
        obj[item.key] = item.value
        return obj
      }, {})

      const content = `const resource = ${JSON.stringify(
        intlData,
        null,
        4,
      )};\nexport default resource`

      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(path.join(options.outputDir, "zh_CN.js"), content)
      fse.writeFileSync(path.join(options.outputDir, "en_US.js"), content)
    },
  }
})

module.exports = autoI18nPlugin
