import PkgInfo from "../../pkg-info.js"

import _resolveFilename from "../_resolve-filename.js"
import decodeURIComponent from "../../util/decode-uri-component.js"
import { dirname } from "path"
import encodedSlash from "../../util/encoded-slash.js"
import errors from "../../errors.js"
import isPath from "../../util/is-path.js"
import parseURL from "../../util/parse-url.js"
import urlToPath from "../../util/url-to-path.js"

const codeOfSlash = "/".charCodeAt(0)

const esmExts = [".mjs", ".js", ".json", ".node"]
const gzExts = esmExts.concat(".gz", ".mjs.gz", ".js.gz")

const localhostRegExp = /^\/\/localhost\b/
const queryHashRegExp = /[?#].*$/

function resolveFilename(id, parent, isMain) {
  if (typeof id !== "string") {
    throw new errors.TypeError("ERR_INVALID_ARG_TYPE", "id", "string")
  }

  const parentFilename = (parent && parent.filename) || "."
  const fromPath = dirname(parentFilename)
  let skipWarnings = false

  if (! encodedSlash(id)) {
    if (! isPath(id) &&
        (id.charCodeAt(0) === codeOfSlash || id.includes(":"))) {
      const parsed = parseURL(id)
      let foundPath = urlToPath(parsed)

      if (! foundPath &&
          parsed.protocol !== "file:" &&
          ! localhostRegExp.test(id)) {
        throw new errors.Error("ERR_INVALID_PROTOCOL", parsed.protocol, "file:")
      }

      if (foundPath) {
        foundPath = _resolveFilename(foundPath, parent, isMain)
      }

      if (foundPath) {
        return foundPath
      }
    } else {
      // Prevent resolving non-local dependencies:
      // https://github.com/bmeck/node-eps/blob/rewrite-esm/002-es-modules.md#432-removal-of-non-local-dependencies
      let searchExts = esmExts
      let skipGlobalPaths = true
      const pkgInfo = PkgInfo.get(fromPath)

      if (pkgInfo) {
        const { options } = pkgInfo

        if (options.gz) {
          searchExts = gzExts
        }

        if (options.cjs.paths) {
          skipGlobalPaths = false
        }
      }

      const decodedId = decodeURIComponent(id.replace(queryHashRegExp, ""))
      const foundPath = _resolveFilename(decodedId, parent, isMain, skipWarnings, skipGlobalPaths, searchExts)

      if (foundPath) {
        return foundPath
      }
    }
  }

  skipWarnings = true
  const foundPath = _resolveFilename(id, parent, isMain, skipWarnings)

  if (foundPath) {
    throw new errors.Error("ERR_MODULE_RESOLUTION_LEGACY", id, fromPath, foundPath)
  }

  throw new errors.Error("ERR_MISSING_MODULE", id)
}

export default resolveFilename
