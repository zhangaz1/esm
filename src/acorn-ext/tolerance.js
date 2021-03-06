import AcornError from "../acorn-error.js"

import wrap from "../util/wrap.js"

const alwaysFalse = () => false
const alwaysTrue = () => true
const noop = () => {}

const engineDupPrefix = "Duplicate export of '"
const parserDupPrefix = "Duplicate export '"

const engineTypePostfix = "may only be used in ES modules"
const parserTypePostfix = "may appear only with 'sourceType: module'"

function enable(parser) {
  parser.checkExpressionErrors =
  parser.isDirectiveCandidate =
  parser.strictDirective = alwaysFalse

  parser.canDeclareLexicalName =
  parser.canDeclareVarName =
  parser.isSimpleParamList = alwaysTrue

  parser.adaptDirectivePrologue =
  parser.checkParams =
  parser.checkPatternErrors =
  parser.checkPatternExport =
  parser.checkPropClash =
  parser.checkVariableExport =
  parser.checkYieldAwaitInDefaultParams =
  parser.declareLexicalName =
  parser.declareVarName =
  parser.enterFunctionScope =
  parser.enterLexicalScope =
  parser.exitFunctionScope =
  parser.exitLexicalScope = noop

  parser.checkLVal = wrap(parser.checkLVal, strictWrapper)
  parser.raise = raise
  parser.raiseRecoverable = raiseRecoverable

  parser.strict = false
  return parser
}

function raise(pos, message) {
  // Correct message for `let default`:
  // https://github.com/ternjs/acorn/issues/544
  if (message === "The keyword 'let' is reserved") {
    message = "Unexpected token"
  } else if (message.endsWith(parserTypePostfix)) {
    message = message.replace(parserTypePostfix, engineTypePostfix)
  }

  throw new AcornError(this, pos, message)
}

function raiseRecoverable(pos, message) {
  if (message.startsWith(parserDupPrefix)) {
    message = message.replace(parserDupPrefix, engineDupPrefix)
    throw new AcornError(this, pos, message)
  }

  if (message.startsWith("Binding ") ||
      message === "new.target can only be used in functions" ||
      message === "The keyword 'await' is reserved") {
    throw new AcornError(this, pos, message)
  }
}

function strictWrapper(func, args) {
  this.strict = true

  try {
    return func.apply(this, args)
  } finally {
    this.strict = false
  }
}

export { enable }
