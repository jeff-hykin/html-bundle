import { FileSystem } from "https://deno.land/x/quickr@0.6.67/main/file_system.js"
import { parseArgs, flag, required, initialValue } from "https://deno.land/x/good@1.7.1.0/flattened/parse_args.js"
import { toCamelCase } from "https://deno.land/x/good@1.7.1.0/flattened/to_camel_case.js"
import { didYouMean } from "https://deno.land/x/good@1.7.1.0/flattened/did_you_mean.js"

import { fill } from './impure_api.js'
import { version } from "./version.js"

// 
// check for help/version
// 
    const { help: showHelp, version: showVersion, } = parseArgs({
        rawArgs: Deno.args,
        fields: [
            [["--help", ], flag, ],
            [["--version"], flag, ],
        ],
    }).simplifiedNames
    if (showVersion) {
        console.log(version)
        Deno.exit(0)
    }
    if (showHelp || Deno.args.length === 0) {
        console.log(`
    Html Bundle
        examples:
            html-bundle --help
            html-bundle --version
            
            # simple
            html-bundle index.html index.bundled.html
            html-bundle -- index.html index.bundled.html

            # auto
            html-bundle index.html

            # destructive (overwrites index.html)
            to-esm --inplace index.html
        `)
        Deno.exit(0)
    }

// 
// normal usage
// 
    const output = parseArgs({
        rawArgs: Deno.args,
        fields: [
            [[ 0 ], required, ],
            [[ 1 ],  ],
            [[ "--inplace", "-i"], flag, ],
        ],
        nameTransformer: toCamelCase,
        namedArgsStopper: "--",
        allowNameRepeats: true,
        valueTransformer: JSON.parse,
        isolateArgsAfterStopper: false,
        argsByNameSatisfiesNumberedArg: true,
        implicitNamePattern: /^(--|-)[a-zA-Z0-9\-_]+$/,
        implictFlagPattern: null,
    })
    didYouMean({
        givenWords: Object.keys(output.implicitArgsByName).filter(each=>each.startsWith(`-`)),
        possibleWords: Object.keys(output.explicitArgsByName).filter(each=>each.startsWith(`-`)),
        autoThrow: true,
    })
    
    console.debug(`output is:`,output)
    const { inplace } = output.simplifiedNames
    let source = output.argList[0]
    let destination = output.argList[1]
// 
// 
// main logic
// 
// 
    console.debug(`source is:`,source)
    console.debug(`destination is:`,destination)
    if (inplace) {
        destination = source
    } else {
        if (typeof destination !== "string") {
            destination = source.replace(/\.(\w+)$/,`.bundled.$1`)
        }
    }
    if (!FileSystem.sync.info(source).exists) {
        throw Error(`source file does not exist: ${FileSystem.makeAbsolutePath(source)}`)
    }
    await fill({
        indexHtmlPath: source,
        newPath: destination,
    })