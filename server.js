const utils = require('./utils/utils')
const cpuCount = require('os').cpus().length
const {Worker} = require('worker_threads')
const urls = require('./url.json')
const fs = require('fs')
const path = require('path')

let i, index = 0;

const myArgs = process.argv.slice(2);
console.time("main")

if (myArgs.includes("--verify")) {
    if (fs.existsSync("data/website.json")) {
        console.log("Verifying...")
        verify()
    } else {
        console.log("\x1b[31m%s\x1b[0m", "Data file 'data/website.json' doesn't exist. Execute a 'node . --save' before. Stopping application.")
        console.log("\x1b[31m%s\x1b[0m", "Stopping application.")
    }
} else {
    main()
}

function main() {
    createWorker(urls)
        .then((array) => {
            const value = array[0];

            value.forEach(site => {
                const statusCode = site.status;
                if (statusCode !== 200) {
                    console.log("\x1b[31m%s\x1b[0m", "URL error: " + site.url + " - Status: " + site.status);
                } else {
                    console.log("\x1b[32m%s\x1b[0m", "URL: " + site.url + " - Status: " + site.status)
                }
            })

            if (myArgs.includes("--save")) {
                save(value)
            } else {
                console.timeEnd("main")
            }
        })
}

function save(value) {
    const data = JSON.stringify(value, null, 2);

    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    fs.writeFile('data/website.json', data, (err) => {
        if (err) throw err;
        console.log("\x1b[32m%s\x1b[0m", "Data written to file");
        console.timeEnd("main")
    });
}

function verify() {
    createWorker(urls)
        .then((array) => {
            const rawData = fs.readFileSync(path.resolve('data/website.json'));
            const old = JSON.parse(rawData);
            const value = array[0];

            if (old.length === value.length) {
                let same = true;
                for (let y = 0; y < value.length; y++) {
                    if (old[y].status !== value[y].status) {
                        same = false;
                        console.log("\x1b[31m%s\x1b[0m", "Site: " + value[y].url + " is not the same as before. Actual value " + value[y].status +
                            " - before " + old[y].status)
                    }
                }

                if (same) {
                    console.log("\x1b[32m%s\x1b[0m", "Verification successful!")
                    if (myArgs.includes("--save")) {
                        save(value)
                    } else {
                        console.timeEnd("main")
                    }
                } else {
                    console.log("\x1b[31m%s\x1b[0m", "Verification failed!")
                }
            } else {
                console.log("\x1b[31m%s\x1b[0m", "Verification failed. OldSites.length != newSite.length !")
            }
        })
}

async function createWorker(array) {
    const chunk = utils.splitIntoChunk(array, cpuCount)
    const worker = [];
    for (let workerArray of chunk) {
        worker.push(sendWorker(workerArray))
        index++
    }
    return Promise.all(worker)
}

function sendWorker(workerData) {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./worker.js", {})
        worker.postMessage({index: index, data: workerData})

        worker.on('message', resolve)
        worker.on('error', error => {
            console.log("Error from worker " + error)
            return reject(error)
        })
        worker.on('exit', code => {
            i++
            if (i === index) {
                console.log("finish")
                console.timeEnd("main")
            }
            if (code !== 0)
                utils.throwError(new Error(`Worker stopped with exit code ${code}`))

        })
    })
}
