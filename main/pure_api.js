import { Parser, parserFromWasm, xmlStylePreview } from "https://deno.land/x/deno_tree_sitter@0.2.5.2/main.js"
// import { Parser, parserFromWasm, xmlStylePreview } from "/Users/jeffhykin/repos/deno-tree-sitter/main.js"
import html from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/a1c34a3a73a173f82657e25468efc76e9e593843/main/html.js"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts"
const htmlParser = await parserFromWasm(html)

/**
 * Injects HTML content into a document by replacing script and style tags with their corresponding file contents.
 *
 * @example
 * ```js
 * inject({
 *      askForFileContents: (pathBeingImported, kind)=>{
 *          // kind is one of [ "js", "css", "img" ]
 *          if (pathBeingImported.startsWith("https://")) {
 *              return fetch(pathBeingImported).then(each=>each.text())
 *          } else {
 *              return fs.readFileSync(pathBeingImported)
 *          }
 *      },
 *      htmlFileContents: `
 *          <!DOCTYPE html>
 *          <html lang="en">
 *              <head>
 *                  <meta charset="UTF-8">
 *                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
 *                  <meta http-equiv="X-UA-Compatible" content="ie=edge">
 *                  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
 *                  <title>Vry Cool Website</title>
 *              <link rel="stylesheet" href="main.css"></head>
 *              <body>
 *                  <div id="vue-root">
 *                  </div>
 *                  <script src="index.js"></script>
 *              </body>
 *              <script src="something.js"></script>
 *              <!-- I don't get deleted  -->
 *          </html>
 *          <!-- neither do I -->
 *      `,
 *  })
 * ```
 * @param {object} args - 
 * @param {string} args.htmlFileContents - The HTML file contents to be processed.
 * @param {function} args.askForFileContents - takes 1 string arg (relative path, ex: the src in a <script> tag) returns a string (file contents)
 * @param {string} args.ifBadPath - "warn", "throw" or "ignore", default is "warn"
 * @param {boolean} [args.shouldBundleScripts=true] - Whether to bundle script tags.
 * @param {boolean} [args.shouldBundleCss=true] - Whether to bundle CSS tags.
 * @param {boolean} [args.shouldBundleImages=true] - Whether to bundle image tags.
 * @param {function} [args.pathToMimeType=null] - A function that takes a url or file path and returns the MIME type of the file.as a string
 * @returns {string} The updated HTML content with script and style tags replaced.
 */
export async function inject({htmlFileContents, askForFileContents, ifBadPath="warn", shouldBundleScripts=true, shouldBundleCss=true, shouldBundleImages=true, pathToMimeType=null}) {
    // 
    // grab start & end (use tree sitter because DOMParser can't do it)
    // 
    const root = htmlParser.parse({string:htmlFileContents, withWhitespace: true}).rootNode
    let htmlStart = ""
    let htmlEnd = ""
    const normalNodeStart = root.quickQueryFirst(`((start_tag (tag_name) @theTagName) (#not-eq? @theTagName "html"))`)
    const normalNodeEnds  = root.quickQuery(     `((end_tag   (tag_name) @theTagName) (#not-eq? @theTagName "html"))`)

    if (normalNodeStart) {
        htmlStart = htmlFileContents.slice(0,normalNodeStart.startIndex)
    }
    if (normalNodeEnds instanceof Array && normalNodeEnds.length > 0) {
        htmlEnd = htmlFileContents.slice(normalNodeEnds[normalNodeEnds.length-1].endIndex)
    }
    
    // 
    // replace javascript and css tags
    // 
    var document = new DOMParser().parseFromString(
        htmlFileContents,
        "text/html",
    )
    let promises = []
    if (shouldBundleCss) {
        var links = [...document.querySelectorAll("link")]
        for (const link of links) {
            const href = link.getAttribute("href")
            if (href && link.getAttribute("rel") === "stylesheet") {
                const styleElement = document.createElement("style")
                // transfer all the attributes over
                for (const eachName of link.getAttributeNames()) {
                    if (eachName != "href" && eachName != "rel") {
                        styleElement.setAttribute(eachName, link.getAttribute(eachName))
                    }
                }
                promises.push(
                    Promise.resolve(askForFileContents(href, "css")).then(cssFileContents=>{
                        // you'd think DOMParser would escape it. You'd be wrong
                        // also: escaping is more of a hack than a real escape. It happens to always work, but its more of a seperate feature of unicode escape sequences than a way to prevent <style>a::before { content: "</style>" }</style> from breaking HTML parsing
                        styleElement.innerHTML = cssFileContents.replace(/<\/style>/g, "\\003C/style>")
                        // swap'em
                        link.replaceWith(styleElement)
                    }).catch(err=>{
                        if (ifBadPath === "warn") {
                            console.warn(`Warning: could not find/load CSS file at path ${href}, keeping original url\nError Message: ${err}`)
                        } else if (ifBadPath === "ignore") {
                            // do nothing
                        } else {
                            throw err
                        }
                    })
                )
            }
        }
    }
    if (shouldBundleScripts) {
        var scripts = [...document.querySelectorAll("script")]
        for (const script of scripts) {
            const src = script.getAttribute("src")
            if (src) {
                script.removeAttribute("src")
                promises.push(
                    Promise.resolve(askForFileContents(src, "js")).then(jsCode=>{
                        script.innerHTML = jsCode.replace(/<\/script>/g, "<\\/script>")
                    }).catch(err=>{
                        if (ifBadPath === "warn") {
                            console.warn(`Warning: for script could not find file for src ${src}, keeping original url\nError Message: ${err}`)
                        } else if (ifBadPath === "ignore") {
                            // do nothing
                        } else {
                            throw err
                        }
                    })
                )
            }
        }
    }
    if (shouldBundleImages) {
        var images = [...document.querySelectorAll("img")]
        for (const imageElement of images) {
            const src = imageElement.getAttribute("src")
            if (src) {
                const promise = new Promise(async (resolve, reject)=>{
                    const mimeType = pathToMimeType ? await pathToMimeType(src) : "image"
                    const fileContents = await askForFileContents(src, "img")
                    const srcAttribute = uint8ArrayToBase64SrcAttribute(mimeType, fileContents)
                    resolve(srcAttribute)
                })
                promises.push(
                    promise.then(newSrcAttribute=>{
                        imageElement.setAttribute("src", newSrcAttribute)
                    }).catch(err=>{
                        if (ifBadPath === "warn") {
                            console.warn(`Warning: for script could not find file for src ${src}, keeping original url\nError Message: ${err}`)
                        } else if (ifBadPath === "ignore") {
                            // do nothing
                        } else {
                            throw err
                        }
                    })
                )
            }
        }
    }
    await Promise.all(promises)
    // NOTE: even if a script tag is past the body closing tag (ex: </body><script></script>) it will end up inside the body when doing document.body.outerHTML
    return `${htmlStart}${document.head.outerHTML}\n${document.body.outerHTML}${htmlEnd}`
}

/**
 * Converts a Uint8Array to a base64-encoded data URI string.
 *
 * @param {string} mimeType - The MIME type of the data.
 * @param {Uint8Array} uint8Array - The binary data to be converted.
 * @returns {string} A base64-encoded data URI string.
 *
 * @example
 *     imgElement.src = uint8ArrayToBase64SrcAttribute("image/png", Deno.readFileSync("./file.png"))
 */
export function uint8ArrayToBase64SrcAttribute(mimeType, uint8Array) {
    if (uint8Array instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(uint8Array)
    }
    // Note: this is done in a for loop because it'll cause a stack overflow for even mid-sized files
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i])
    }
    return `data:${mimeType};base64,${btoa(binaryString)}`
}