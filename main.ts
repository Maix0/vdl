import {
    get
} from "./lib"
import {
    program
} from "commander"

program.version("0.0.1").name("vdl")

function collect(value: any, previous: any) {
    return previous.concat([value]);
}

program
    .requiredOption('-u, --url <url> <output>', 'video url with output filename', collect, [])
    //.option("-H, --header <header...>", "additional header with format <key@value>")
    .option("-n, --no-default [default]", "don't use default header");

program.parse(process.argv);
let url_with_output: [string, string][] = [];
program.url.forEach((url: string) => {
    let index = program.rawArgs.findIndex((a: any) => a == url);
    let obj = program.rawArgs.splice(index, 2)
    url_with_output.push(obj)
});

url_with_output.forEach(([url, output]) => {
    get({
        url: url,
        output: output,
        default_header: program.default == "true" || program.default ? true : false
    })
})
