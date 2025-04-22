export function escapeForStyleTag(string) {
    return string.replace(/<\/style>/g, "\\003C/style>")
}
export function escapeForScriptTag(string) {
    return string.replace(/<\/script>/g, "<\\/script>")
}