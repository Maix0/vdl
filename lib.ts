import https from "https";
import fs from "fs";
import cliProgress from "cli-progress";
import http from "http";

const bar_opt = {
    format: '{filename} [{bar}] {percentage}% | ETA: {eta}s | {value_fmt} {value_unit}/{total_fmt} {total_unit}'
}

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
    for (let i = 0; i < 5; i++) {
        size_arr.push([size / 10 ** (3 * i), i])
    }
    size_arr = size_arr.map((n) => [Math.floor(n[0]), n[1]]).filter(n => n[0] > 0).reverse();
    let unit = SizeUnit.B;
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


export function get(option: any) {
    let { url, output, default_header } = option;
    try {
        url = new URL(url)
    }
    catch (e) {
        if (e instanceof TypeError) {
            console.log("The provided url isn't valid")
            return
        }
    }
    const file = fs.createWriteStream(output);
    https.get(url, {
        headers: {
            ...(default_header ? headers : {})
        }
    }, (res: http.IncomingMessage) => {
        res.on("error", console.error)
        const len = Number(res.headers["content-length"]);
        const [len_fmt, len_unit] = get_Size(len);
        let bar = new cliProgress.SingleBar(bar_opt);
        bar.start(len, 0, {
            total_fmt: len_fmt,
            total_unit: len_unit,
            value_fmt: 0,
            value_unit: SizeUnit.B,
            filename: output
        })
        let p = res.pipe(file)
        const update = () => {
            let [val_fmt, val_unit] = get_Size(p.bytesWritten);
            bar.update(p.bytesWritten, {
                total_fmt: len_fmt,
                total_unit: len_unit,
                value_fmt: val_fmt,
                value_unit: val_unit,
                filename: output
            })
            if (p.bytesWritten >= len) {
                bar.stop()
            } else {
                setTimeout(update, 1000)
            }
        }
        setTimeout(update, 1000)
    })
}