import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js' 
import { convert } from "../main/pure_api.js"


console.log(await convert({
    askForFileContents:(path)=>"Yo",
    htmlFileContents: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <title>iLab Database</title>
        <link rel="stylesheet" href="Root.2c03686a.css"></head>
        <body>
            <div id="vue-root">
            </div>
            <!-- howdy -->
            <script src="Root.4710667b.js"></script>
        </body>
        <script src="blah"></script>
        </html>`, 
}))