# What is this?

Reliable simple HTML bundling (NOT a regex hack like [other HTML single-file bundlers](https://github.com/richardtallent/vite-plugin-singlefile/blob/ae4368c365d5034a9ff4037a71a1046ecf56b132/src/index.ts#L28)). This uses the deno tree sitter parser and JS DOM, to escape and bundle all direct css, js, and image dependencies of an HTML file into one giant HTML file. This includes both local file paths and http/https urls.

# How do I use it?

Theres three ways you can use this library.

### 1. Command Line

Install

```shell
# isntall deno
curl -fsSL https://deno.land/install.sh | sh
# install html-bundle
deno install -Afg https://deno.land/x/html_bundle/main/html-bundle.js
```

Usage:
```sh
html-bundle --help
html-bundle --version
            
# simple
html-bundle index.html index.bundled.html
html-bundle -- index.html index.bundled.html

# auto
html-bundle index.html

# destructive (overwrites index.html)
html-bundle --inplace index.html

# selective bundling
html-bundle --shouldBundleImages false index.html
html-bundle --shouldBundleScripts false index.html
html-bundle --shouldBundleCss false index.html

# error behavior
html-bundle --ifBadPath warn   index.html
html-bundle --ifBadPath ignore index.html
html-bundle --ifBadPath throw  index.html
```

### 2. In Deno

```js
import { fill } from "https://deno.land/x/html_bundle@0.0.3.0/main/impure_api.js"

await fill({
    indexHtmlPath: "../test_content/test1/index.html",
    newPath: "../logs/test1.html"
})
```

### 3. On the Web

```js
import { inject } from "https://deno.land/x/html_bundle@0.0.3.0/main/pure_api.js"

console.log(await inject({
    askForFileContents:(path)=>(({
        // this would break most html bundlers
        "something.js": `console.log("</script>")`,
        "index.js": `console.log("yo")`,
        "main.css": `body { color: red }`,
    })[path]),
    htmlFileContents: `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
                <title>Vry Cool Website</title>
            <link rel="stylesheet" href="main.css"></head>
            <body>
                <div id="vue-root">
                </div>
                <script src="index.js"></script>
            </body>
            <script src="something.js"></script>
            <!-- I don't get deleted  -->
        </html>
        <!-- neither do I -->
    `, 
}))
```
