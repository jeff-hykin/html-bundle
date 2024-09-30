import { inject } from "./pure_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.72/main/file_system.js"

/**
 * Reads the contents of an HTML file at the specified path, and injects the contents into a bundle using the `inject` function from the `pure_api.js` module.
 *
 * @param {string} path - The path to the HTML file to be read and injected.
 * @returns {string} - An object containing the injected HTML file contents and a function to fetch the contents of other files referenced in the HTML.
 * @throws {Error} - If the HTML file cannot be found at the specified path.
 */
export async function pureFill(path, options={}) {
    const htmlFileContents = await FileSystem.read(path)
    if (!htmlFileContents) {
        throw new Error(`When calling html-bundle pureFill, I could not find file at path ${JSON.stringify(path)}`)
    }
    const parentPath = FileSystem.parentPath(path)
    return inject({
        htmlFileContents,
        askForFileContents: async (eachPath, kind)=>{
            if (eachPath.startsWith("https://") || eachPath.startsWith("http://")) {
                if (kind === "img") {
                    return fetch(eachPath).then(each=>each.arrayBuffer())
                } else {
                    return fetch(eachPath).then(each=>each.text())
                }
            } else {
                // TODO: may need to decodeURI on this to get correct path
                const fullPath = `${parentPath}/${eachPath}`
                let contents
                if (kind === "img") {
                    contents = await FileSystem.readBytes(fullPath)
                } else {
                    contents = await FileSystem.read(fullPath)
                }
                if (contents == null) {
                    throw new Error(`Could not find file at path ${JSON.stringify(eachPath)}`)
                }
                return contents
            }
        },
        ...options,
    })
}


/**
 * Asynchronously fills a new HTML file with the contents of an existing HTML file.
 *
 * @example
 * ```js
 * import { fill } from "https://deno.land/x/html_bundle/main/impure_api.js"
 * await fill({
 *     indexHtmlPath: "a/path/index.html",
 *     newPath: "a/path/index.bundle.html"
 * })
 * ```
 * @param {Object} arg - The options object.
 * @param {string} arg.indexHtmlPath - The path to the existing HTML file.
 * @param {string} arg.newPath - The path to the new HTML file.
 * @param {string} [arg.ifBadPath="warn"] - The behavior to use when there is an issue reading a file, either "warn" or "throw".
 * @param {boolean} [arg.shouldBundleScripts=true] - Whether to bundle any referenced scripts.
 * @param {boolean} [arg.shouldBundleCss=true] - Whether to bundle any referenced CSS.
 * @returns {Promise<void>} - A promise that resolves when the new HTML file has been written.
 * @throws {Error} - If the `newPath` argument is missing, or (depending on ifBadPath) if the file cannot be read.
 */
export const fill = async ({indexHtmlPath, newPath, ifBadPath="warn", shouldBundleScripts=true, shouldBundleCss=true})=>{
    if (!newPath) {
        throw new Error("missing newPath argument when calling fill from html-bundle")
    }
    const newHtmlFileContents = await pureFill(indexHtmlPath, {ifBadPath, shouldBundleScripts, shouldBundleCss})
    return FileSystem.write({ data: newHtmlFileContents, path: newPath })
}