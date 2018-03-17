let request = require('request');
let googleAPIKey = process.env.GOOGLE_API_KEY
let logLevel = process.env.IMMO_LOG_LEVEL;
exports.fnGetCoordinates = function(sExposeAddress){
    if(logLevel === 2){
        console.log("GoogleHelper: Resolving address: " + sExposeAddress);
    }
    let sBaseUrl = "https://maps.googleapis.com/maps/api/geocode/json";
    let sAddress = "?address=" + encodeURI(sExposeAddress);
    let sKey = "&key=" + googleAPIKey;
    let sRequestUrl = sBaseUrl + sAddress + sKey;
    let oPromise = new Promise((resolve,reject) => {
        request(sRequestUrl, (error, response, body) => {
            if (error) {
                console.log('GoogleHelper Error:', error); // Print the error if one occurred
                reject()
            }
            if (response && response.statusCode === 200) {
                let oReturn = {};
                oResponse = JSON.parse(body);
                if(oResponse.results[0] && 
                    oResponse.results[0].geometry &&
                    oResponse.results[0].geometry.viewport &&
                    oResponse.results[0].geometry.viewport.northeast){
                    oReturn.lat = oResponse.results[0].geometry.viewport.northeast.lat;
                    oReturn.lng = oResponse.results[0].geometry.viewport.northeast.lng;
                }
                resolve(oReturn)
            } else {
                console.log('GoogleHelper: ' + sRequestUrl)
                console.log('body: ' + body)
                if (response && response.statusCode) {
                    console.log('GoogleHelper: Received statuscode ' + response.statusCode)
                }
                reject()
            }
        })
    });
    return oPromise;
    
};
