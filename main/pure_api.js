// import { Parser, parserFromWasm, xmlStylePreview } from "https://deno.land/x/deno_tree_sitter@0.2.3.1/main.js"
import { Parser, parserFromWasm, xmlStylePreview } from "/Users/jeffhykin/repos/deno-tree-sitter/main.js"
import html from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/e2c125ea47a0eee2453f0cbe7ca8a8d19d04df03/main/html.js"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts"
const htmlParser = await parserFromWasm(html)

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
            const cssFileContents = (await askForFileContents(href))
            // you'd think DOMParser would escape it. You'd be wrong
            // also: escaping is more of a hack than a real escape. It happens to always work, but its more of a seperate feature of unicode escape sequences than a way to prevent <style>a::before { content: "</style>" }</style> from breaking HTML parsing
            styleElement.innerHTML = cssFileContents.replace(/<\/style>/g, "\\003C/style>")
            // swap'em
            link.replaceWith(styleElement)
        }
    }
    var scripts = [...document.querySelectorAll("script")]
    for (const script of scripts) {
        const src = script.getAttribute("src")
        if (src) {
            script.removeAttribute("src")
            const jsCode = await askForFileContents(src)
            script.innerHTML = jsCode.replace(/<\/script>/g, "<\\/script>")
        }
    }
    // NOTE: even if a script tag is past the body closing tag (ex: </body><script></script>) it will end up inside the body when doing document.body.outerHTML
    return `${htmlStart}${document.head.outerHTML}\n${document.body.outerHTML}${htmlEnd}`
}