import {
    get
} from "./lib"
import {
    program
} from "commander"

program.version("0.0.1")

program
    .requiredOption('-u, --url <url>', 'video url')
    .requiredOption('-o, --output <filename>', 'output file');

program.parse(process.argv);
get(program.url, program.output)