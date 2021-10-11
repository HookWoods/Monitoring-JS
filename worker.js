const {parentPort} = require('worker_threads')
const axios = require("axios");

parentPort.on('message', workerMessage => worker(workerMessage))

async function worker(data) {
    if (data.data instanceof Object) {
        const promiseArray = data.data.map(url => sendRequest(url))

        await Promise.all(promiseArray);
        await parentPort.postMessage(`Worker #${data.index} has finished`)
        await parentPort.close()
    }
}

function sendRequest(url) {
    return new Promise((resolve, reject) => {
        axios.get(url).then((response) => {
            console.log(`[${response.status}] ${url}`)
            return resolve(response);
        }).catch((error) => {
            console.error(`[${error.response.status ?? error.response.statusText}] ${url}`)
            return reject(error)
        })
    })
}

// Cancel warning axios
process.on('unhandledRejection', error => {});
