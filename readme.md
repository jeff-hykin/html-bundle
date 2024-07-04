# What is this for?

Properly converting html, css, and js files to a single html file.

# How do I use it?

```js
import { fill } from "../main/impure_api.js"

await fill({
    indexHtmlPath: "../test_content/test1/index.html",
    newPath: "../logs/test1.html"
})
```