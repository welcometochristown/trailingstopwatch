const fetch = require('node-fetch');

const sendPushOver = async (msg) => {
    const url = 'https://api.pushover.net/1/messages.json';
    const body = JSON.stringify({
        "user": "u1fuqaj5nwabpgwpctjws2f1ax9ppq",
        "token" : "av4g4ewiukc62sm24dyu5fvkta8grf",
        "message" : msg
    });

    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body:body
    })
    .catch(err => logger.logError(err));

}

const sendEmail = (msg) => {
    return new Promise(function(resolve, reject) {
        exec('echo "' + msg + '" | mail -s "' + msg + '" wtctstockalerts@gmail.com', (err, stdout, stderr) => {
            
            if (err) {
                console.logError(err)
                reject(err);
            } 
            else {
                resolve();
            }                
        });
    });
}

module.exports.sendPushOver = sendPushOver;
module.exports.sendEmail = sendEmail;