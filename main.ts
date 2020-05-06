#!/usr/bin/env node

import cliProgress from "cli-progress";
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
import chalk from "chalk"

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
    let counter = 0;
    let err_coutner = 0;
    let gets: Promise<boolean>[] = []
    let bar_handler = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: `{filename}\t{g}{duration_formatted}{w} [{bar}] {c}{percentage}{w}% | ETA: {y}{eta_formatted}{w} | {value_fmt} {value_unit}/{total_fmt} {total_unit}`,
        linewrap: false,
    }, cliProgress.Presets.legacy);
    for (let index = 0; index < url_with_output.length; index++) {
        const [url, output] = url_with_output[index];
        await new Promise((res) => {
            setTimeout(() => {
                gets.push(get({
                    url: url,
                    output: output,
                    default_header: program.default == "true" || program.default ? true : false,
                    main_bar: bar_handler
                }))
                res()
            }, 100)
        })
    }
    (await Promise.all(gets)).forEach((b) => {
        if (b) {
            counter += 1;
        }
        else {
            err_coutner += 1;
        }
    })
    bar_handler.stop()
    console.log(chalk`{white Finished} {yellow ${counter}} downloads in {green ${moment(moment().diff(startTime)).format("mm:ss")}} ${err_coutner > 0 ? chalk`({grey with {red ${err_coutner}} failure${err_coutner > 1 ? "s" : ""}})` : ""}`)
}
main()