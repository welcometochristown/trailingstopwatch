

const enableDebug = !true;
const enableError = true;
const enableInfo = true;

const logDebug = (txt) => {
    if(enableDebug) {
        console.log(txt);
    }
}

const logInfo = (txt) => {
    if(enableInfo) {
        console.log(txt);
    }
}

const logError = (txt) => {
    if(enableError) {
        console.log(txt);
    }
}

const log = (txt) => {
    logDebug(txt);
}

module.exports.log = log;
module.exports.logDebug = logDebug;
module.exports.logInfo = logInfo;
module.exports.logError = logError;