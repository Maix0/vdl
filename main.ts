#!/usr/bin/env node
import {
    get
} from "./lib"
import {
    program
} from "commander"
import * as fs from "fs"
import {
    promisify
} from "util"
const readFile = promisify(fs.readFile)
import moment from "moment"

async function main() {
    program.version("0.0.1").name("vdl")

    function collect(value: any, previous: any) {
        if (previous == undefined) {
            previous = []
        }
        return previous.concat([value]);
    }

    program
        .option('-u, --url <url> <output>', 'video url with output filename', collect)
        .option("-n, --no-default [default]", "don't use default header")
        .option("-f, --from-file <file>", "Use a file with all the urls");

    program.parse(process.argv);
    let url_with_output: [string, string][] = [];
    if (program.url) {
        program.url.forEach((url: string) => {
            let index = program.rawArgs.findIndex((a: any) => a == url);
            let obj = program.rawArgs.splice(index, 2)
            url_with_output.push(obj)
        });
    }
    if (program.fromFile) {
        url_with_output = (Object.entries(JSON.parse((await readFile(program.fromFile)).toString("utf-8"))) as [string, string][]).map(value => [value[1], value[0]])
    }
    if (program.url &&
        program.fromFile) {
        return console.log("Error:\n You can't use -f and -u at the same time")
    }
    let startTime = moment()
    let index = 0;
    for (index = 0; index < url_with_output.length; index++) {
        const [url, output] = url_with_output[index];
        await get({
            url: url,
            output: output,
            default_header: program.default == "true" || program.default ? true : false
        })
    }
    console.log(`Finished ${index + 1} downloads in ${moment().diff(startTime, "s")}s`)
}
main()