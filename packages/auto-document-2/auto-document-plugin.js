const { declare } = require("@babel/helper-plugin-utils")
const doctrine = require("doctrine")
const fse = require("fs-extra")
const path = require("node:path")
const renderer = require("./renderer")

// 用 doctrine 解析注释信息
function parseComment(commentStr) {
  if (!commentStr) return null
  return doctrine.parse(commentStr, { unwrap: true })
}

function generate(docs, format = "json") {
  if (format === "markdown") {
    return {
      ext: ".md",
      content: renderer.markdown(docs),
    }
  } else if (format === "html") {
    return {
      ext: "html",
      content: renderer.html(docs),
    }
  } else {
    return {
      ext: "json",
      content: renderer.json(docs),
    }
  }
}

// path.getTypeAnnotation() 取到的类型需要做进一步处理，使其更易读
function resolveType(tsType) {
  switch (tsType.type) {
    case "TSStringKeyword":
      return "string"
    case "TSNumberKeyword":
      return "number"
    case "TSBooleanKeyword":
      return "boolean"
  }

  return "unknown"
}

const autoDocumentPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      // 全局 file 对象中添加一个 docs 数组，用于收集信息
      file.set("docs", [])
    },
    visitor: {
      // 拿到函数的各种信息
      FunctionDeclaration(path, state) {
        const docs = state.file.get("docs")
        docs.push({
          type: "function",
          name: path.get("id").toString(),
          params: path.get("params").map((paramPath) => ({
            name: paramPath.toString(),
            type: resolveType(paramPath.getTypeAnnotation()),
          })),
          return: resolveType(path.get("returnType").getTypeAnnotation()),
          doc:
            path.node.leadingComments &&
            parseComment(path.node.leadingComments[0].value),
        })
        state.file.set("docs", docs)
      },
      // 拿到类的各种信息
      // 构造函数
      ClassDeclaration(path, state) {
        const docs = state.file.get("docs")
        const classInfo = {
          type: "class",
          name: path.get("id").toString(),
          constructorInfo: {},
          methodsInfo: [],
          propertiesInfo: [],
          doc: null,
        }

        if (path.node.leadingComments) {
          classInfo.doc = parseComment(path.node.leadingComments[0].value)
        }

        path.traverse({
          // 属性
          ClassProperty(path) {
            classInfo.propertiesInfo.push({
              name: path.get("key").toString(),
              type: resolveType(path.getTypeAnnotation()),
              doc: [path.node.leadingComments, path.node.trailingComments]
                .filter(Boolean)
                .map((comment) => parseComment(comment.value))
                .filter(Boolean),
            })
          },
          // 方法
          ClassMethod(path) {
            if (path.node.kind === "constructor") {
              classInfo.constructorInfo = {
                params: path.get("params").map((paramPath) => ({
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                  doc: parseComment(path.node.leadingComments[0].value),
                })),
              }
            } else {
              classInfo.methodsInfo.push({
                name: path.get("key").toString(),
                doc: parseComment(path.node.leadingComments[0].value),
                params: path.get("params").map((paramPath) => ({
                  name: paramPath.toString(),
                  type: resolveType(paramPath.getTypeAnnotation()),
                })),
                return: resolveType(path.getTypeAnnotation()),
              })
            }
          },
        })
        docs.push(classInfo)
        state.file.set("docs", docs)
      },
    },
    post(file) {
      // 文档生成
      const docs = file.get("docs")
      // 根据插件参数的 format 使用不同的 renderer 渲染
      const res = generate(docs, options.format)

      fse.ensureDirSync(options.outputDir)
      fse.writeFileSync(
        path.join(options.outputDir, "docs" + res.ext),
        res.content,
      )
    },
  }
})

module.exports = autoDocumentPlugin
