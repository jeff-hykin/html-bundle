import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js' 
import { fill } from "../main/impure_api.js"


await fill("../test_content/test1/index.html","../logs/test1.html")