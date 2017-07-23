let request = require('request');

exports.fetchUrlBody = function(url) {
    console.log("urlHelper: accessing url: " + url)
    let oPromise = new Promise((resolve, reject) => {
        request(url,
            function(error, response, body) {
                if (error) {
                    console.log('error:', error); // Print the error if one occurred
                    reject()
                }
                if (response && response.statusCode === 200) {
                    resolve(body)
                } else {
                    console.log('urlHelper: ' + url)
                    console.log('body: ' + body)
                    if (response && response.statusCode) {
                        console.log('urlHelper: Received statuscode ' + response.statusCode)
                    }
                    reject()
                }


            })
    })


    return oPromise
}
