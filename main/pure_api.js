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
 *      askForFileContents: (pathBeingImported)=>{
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
 * @returns {string} The updated HTML content with script and style tags replaced.
 */
export async function inject({htmlFileContents, askForFileContents}) {
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
    var links = [...document.querySelectorAll("link")]
    let promises = []
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
                Promise.resolve(askForFileContents(href)).then(cssFileContents=>{
                    // you'd think DOMParser would escape it. You'd be wrong
                    // also: escaping is more of a hack than a real escape. It happens to always work, but its more of a seperate feature of unicode escape sequences than a way to prevent <style>a::before { content: "</style>" }</style> from breaking HTML parsing
                    styleElement.innerHTML = cssFileContents.replace(/<\/style>/g, "\\003C/style>")
                    // swap'em
                    link.replaceWith(styleElement)
                })
            )
        }
    }
    var scripts = [...document.querySelectorAll("script")]
    for (const script of scripts) {
        const src = script.getAttribute("src")
        if (src) {
            script.removeAttribute("src")
            promises.push(
                Promise.resolve(askForFileContents(src)).then(jsCode=>{
                    script.innerHTML = jsCode.replace(/<\/script>/g, "<\\/script>")
                })
            )
        }
    }
    await Promise.all(promises)
    // NOTE: even if a script tag is past the body closing tag (ex: </body><script></script>) it will end up inside the body when doing document.body.outerHTML
    return `${htmlStart}${document.head.outerHTML}\n${document.body.outerHTML}${htmlEnd}`
}