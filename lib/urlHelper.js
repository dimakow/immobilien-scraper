let request = require('request');

exports.fetchUrlBody = function(url) {
    let oPromise = new Promise((resolve, reject) => {
        request(url,
            function(error, response, body) {
                if (error) {
                    console.log('error:', error); // Print the error if one occurred
                    reject()
                }
                if (response.statusCode !== 200) {
                    console.log('Received statuscode != 200')
                    reject()
                }
                resolve(body)

            })
    })


    return oPromise
}
