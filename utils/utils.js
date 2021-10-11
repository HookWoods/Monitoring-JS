module.exports = {
    splitIntoChunk: function (target, size) {
        return target.reduce((previous, current, index) => {
            if (index % (target.length / size) === 0 && index !== 0) previous.push([])
            previous[previous.length - 1].push(current)
            return previous
        }, [[]])
    },
}
