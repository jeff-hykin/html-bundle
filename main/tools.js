export { default as escapeHtml } from "https://esm.sh/lodash@4.17.21/es2022/escape.mjs"
export function escapeForStyleTag(string) {
    return string.replace(/<\/style>/g, "\\003C/style>")
}
export function escapeForScriptTag(string) {
    return string.replace(/<\/script>/g, "<\\/script>")
}