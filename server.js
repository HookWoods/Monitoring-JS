const utils = require('./utils/utils');
const cpuCount = require('os').cpus().length
const {Worker} = require('worker_threads');
const urls = require('./url.json')
let i, index = 0;

console.time("main")
createWorker(urls);

function createWorker(array) {
    const chunk = utils.splitIntoChunk(array, cpuCount)
    for (let workerArray of chunk) {
        sendWorker(workerArray)
        index++
    }
}

function sendWorker(array) {
    const worker = new Worker("./worker.js", {})
    worker.postMessage({index: index, data: array})

    worker.on('message', workerMessage => console.log(workerMessage))
    worker.on('error', error => throw error)
    worker.on('exit', code => {
        i++
        if (i === index) {
            console.log("finish")
            console.timeEnd("main")
        }
        if (code !== 0)
            utils.throwError(new Error(`Worker stopped with exit code ${code}`))

    })
}
