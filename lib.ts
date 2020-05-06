import fs from "fs";

import fetch from "node-fetch";
import util from 'util';
const streamPipeline = util.promisify(require('stream').pipeline);
import chalk from "chalk"


const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0",
}

enum SizeUnit {
    B = "B",
    Kb = "Kb",
    Mb = "Mb",
    Gb = "Gb",
    Tb = "Tb",
}

function get_Size(size: number): [number, SizeUnit] {
    let size_arr: number[][] = []
    if (typeof size != "number") {
        return [0, SizeUnit.B]
    }
    for (let i = 0; i < 5; i++) {
        size_arr.push([size / 10 ** (3 * i), i])
    }
    size_arr = size_arr.map((n) => [Math.floor(n[0]), n[1]]).filter(n => n[0] > 0).reverse();
    let unit = SizeUnit.B;

    if (!size_arr.length) {
        return [0, SizeUnit.B]
    }
    switch (size_arr[0][1]) {
        case 0:
            unit = SizeUnit.B
            break;
        case 1:
            unit = SizeUnit.Kb
            break;
        case 2:
            unit = SizeUnit.Mb
            break;
        case 3:
            unit = SizeUnit.Gb
            break;
        case 4:
            unit = SizeUnit.Tb
            break;
    }
    return [size_arr[0][0], unit]
}


export async function get(option: any): Promise<boolean> {
    return await new Promise(async (ok, err) => {
        let {
            url,
            output,
            default_header,
            main_bar
        } = option;
        try {
            url = new URL(url)
        } catch (e) {
            if (e instanceof TypeError) {
                //console.log(chalk`{magenta ${output}} \t {red Given url isn't valid}`)
                return ok(false)
            }
        }
        let finish = false;
        const file = fs.createWriteStream(output);
        file.on("close", () => finish = true)
        const res = (await fetch(url, {
            headers: default_header ? headers : {}
        }).catch((r => {
            console.log(r)
            err(false)
        }))) as unknown as Response
        if (res === null) {
            err(false)
        }
        streamPipeline(res.body, file);
        let len: any = Number(res.headers.get("content-length"));
        if (Number.isNaN(len)) {
            len = "N/A"
        }
        const [len_fmt, len_unit] = get_Size(len);
        let bar = main_bar.create(len, 0, {
            total_fmt: chalk.green(len_fmt),
            total_unit: chalk.grey(len_unit),
            value_fmt: chalk.green(0),
            value_unit: chalk.grey(SizeUnit.B),
            filename: chalk.magenta(output),
            y: chalk.yellow("\uFFFD").split("\uFFFD")[0],
            c: chalk.cyan("\uFFFD").split("\uFFFD")[0],
            w: chalk.white("\uFFFD").split("\uFFFD")[0],
            g: chalk.gray("\uFFFD").split("\uFFFD")[0]
        });
        const update = () => {
            let [val_fmt, val_unit] = get_Size(file.bytesWritten);
            bar.update(file.bytesWritten, {
                total_fmt: chalk.green(len_fmt),
                total_unit: chalk.grey(len_unit),
                value_fmt: chalk.green(val_fmt),
                value_unit: chalk.grey(val_unit),
                filename: chalk.magenta(output)
            })
            if (!finish) {
                setTimeout(update, 1000)
            } else {
                bar.stop()
                ok(true)
            }
        }
        setTimeout(update, 1000)
    })
}