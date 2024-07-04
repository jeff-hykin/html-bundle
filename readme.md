# What is this for?

Properly converting html, css, and js files to a single html file.

# How do I use it?

In Deno:

```js
import { fill } from "https://deno.land/x/html_bundle@0.0.1.1/main/impure_api.js"

await fill({
    indexHtmlPath: "../test_content/test1/index.html",
    newPath: "../logs/test1.html"
})
```

On the web: 
```js
import { inject } from "https://deno.land/x/html_bundle@0.0.1.1/main/pure_api.js"

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