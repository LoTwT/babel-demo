const { declare } = require("@babel/helper-plugin-utils")

function resolveType(targetType) {
  const tsTypeAnnotationMap = {
    TSStringKeyword: "string",
    TSNumberKeyword: "number",
  }

  switch (targetType.type) {
    case "TSTypeAnnotation":
      return tsTypeAnnotationMap[targetType.tsTypeAnnotatio.type]
    case "NumberTypeAnnotation":
      return "number"
    case "StringTypeAnnotation":
      return "string"
  }
}

function noStackTraceWrapper(cb) {
  const tmp = Error.stackTraceLimit
  Error.stackTraceLimit = 0
  cb?.(Error)
  Error.stackTraceLimit = tmp
}

const noFuncAssignLintPlugin = declare((api, options, dirname) => {
  api.assertVersion(7)

  return {
    pre(file) {
      file.set("errors", [])
    },
    visitor: {
      CallExpression(path, state) {
        const errors = state.file.get("errors")

        const argumentsTypes = path
          .get("arguments")
          .map((item) => resolveType(item.getTypeAnnotation()))

        const calleeName = path.get("callee").toString()
        const functionDeclarePath = path.scope.getBinding(calleeName).path
        const declareParamsTypes = functionDeclarePath
          .get("params")
          .map((item) => resolveType(item.getTypeAnnotation()))

        argumentsTypes.forEach((item, index) => {
          if (item !== declareParamsTypes[index]) {
            noStackTraceWrapper((Error) => {
              errors.push(
                path
                  .get("arguments." + index)
                  .buildCodeFrameError(
                    `${item} can not assign to ${declareParamsTypes[index]}`,
                    Error,
                  ),
              )
            })
          }
        })
      },
    },
    post(file) {
      console.log(file.get("errors"))
    },
  }
})

module.exports = noFuncAssignLintPlugin
