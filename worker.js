const {parentPort} = require('worker_threads')
const axios = require("axios");

parentPort.on('message', workerMessage => worker(workerMessage))

async function worker(data) {
    if (data.data instanceof Object) {
        const promise = await Promise.all(data.data.map(url => sendRequest(url)));
        parentPort.postMessage(promise)
        parentPort.close()
    }

}

function sendRequest(url) {
    return axios.get(url, {timeout: 2000})
        .then(response => {
            return {
                url: url,
                status: response.status
            }
        })
        .catch(error => {
            if(error.response) {
                return {
                    url: url,
                    status: error.response.status
                }
            } else {
                return {
                    url: url,
                    status: undefined
                }
            }
        })

}

// Cancel warning axios
process.on('unhandledRejection', () => {
});
