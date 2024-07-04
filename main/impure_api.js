import { inject } from "./pure_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.67/main/file_system.js"

export const pureFill = async (path)=>{
    const htmlFileContents = await FileSystem.read(path)
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

export const fill = async ({indexHtmlPath, newPath})=>{
    if (!newPath) {
        throw new Error("missing newPath argument when calling fill from html-bundle")
    }
    const newHtmlFileContents = await pureFill(indexHtmlPath)
    return FileSystem.write({ data: newHtmlFileContents, path: newPath })
}