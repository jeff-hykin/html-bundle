import { inject } from "./pure_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.67/main/file_system.js"

/**
 * Reads the contents of an HTML file at the specified path, and injects the contents into a bundle using the `inject` function from the `pure_api.js` module.
 *
 * @param {string} path - The path to the HTML file to be read and injected.
 * @returns {string} - An object containing the injected HTML file contents and a function to fetch the contents of other files referenced in the HTML.
 * @throws {Error} - If the HTML file cannot be found at the specified path.
 */
export async function pureFill(path) {
    const htmlFileContents = await FileSystem.read(path)
    if (!htmlFileContents) {
        throw new Error(`When calling html-bundle pureFill, I could not find file at path ${JSON.stringify(path)}`)
    }
    const parentPath = FileSystem.parentPath(path)
    return inject({
        htmlFileContents,
        askForFileContents: (eachPath)=>{
            if (eachPath.startsWith("https://")) {
                return fetch(eachPath).then(each=>each.text())
            } else {
                return FileSystem.read(`${parentPath}/${eachPath}`)
            }
        }
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
 * @returns {Promise<void>} - A promise that resolves when the new HTML file has been written.
 * @throws {Error} - If the `newPath` argument is missing, or if the file cannot be read
 */
export const fill = async ({indexHtmlPath, newPath})=>{
    if (!newPath) {
        throw new Error("missing newPath argument when calling fill from html-bundle")
    }
    const newHtmlFileContents = await pureFill(indexHtmlPath)
    return FileSystem.write({ data: newHtmlFileContents, path: newPath })
}