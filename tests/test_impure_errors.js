import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js' 
import { fill } from "../main/impure_api.js"

try {
    await fill({
        indexHtmlPath: "../test_content/test2/index.html",
        newPath: "../logs/test2.ignore.html",
        ifBadPath: "error"
    })
} catch (error) {
    console.debug(`(good) error is:`,error)
}