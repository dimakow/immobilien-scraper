let request = require('request');
let logLevel = process.env.IMMO_LOG_LEVEL;
const util = require('util');
exports.fetchUrlBody = function(url) {
    if(logLevel === 2){
        console.log("urlHelper: accessing url: " + url);
    }
    
    let oPromise = new Promise((resolve, reject) => {
        request(url,
            function(error, response, body) {
                if (error) {
                    console.log('urlHelper: ' + url);
                    console.log('error:', error); // Print the error if one occurred
                    reject()
                }
                if (response && response.statusCode === 200) {
                    resolve(body)
                } else {
                    console.log('urlHelper: ' + url);
                    if (response && response.statusCode) {
                        console.log('urlHelper: Received statuscode ' + response.statusCode)
                    }
                    reject({msg: "notFound"})
                }


            })
    })
    return oPromise;
}
