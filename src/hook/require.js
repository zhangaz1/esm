import PkgInfo from "../pkg-info.js"

import assign from "../util/assign.js"
import builtinModules from "../builtin-modules.js"
import { dirname } from "path"
import isObjectLike from "../util/is-object-like.js"
import loadESM from "../module/esm/load.js"
import makeRequireFunction from "../module/make-require-function.js"

function hook(parent, options) {
  options = isObjectLike(options) ? PkgInfo.createOptions(options) : null

  return makeRequireFunction(parent, (id) => {
    if (id in builtinModules) {
      return builtinModules[id].exports
    }

    if (options) {
      const parentFilename = (parent && parent.filename) || "."
      const dirPath = dirname(parentFilename)
      const pkgInfo = PkgInfo.read(dirPath, true)

      PkgInfo.set(dirPath, pkgInfo)
      assign(pkgInfo.options, options)
    }

    return loadESM(id, parent, false).exports
  })
}

export default hook
