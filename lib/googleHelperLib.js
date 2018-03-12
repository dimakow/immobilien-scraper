let request = require('request');
let googleAPIKey = process.env.GOOGLE_API_KEY
function googleHelper(oExpose){
    this.address = oExpose.sAdress;

    this.fnGetCoordinates = function(){
        let sBaseUrl = "https://maps.googleapis.com/maps/api/geocode/json";
        let sAddress = "?address=" + encodeURI(this.address);
        let sKey = "&key=" + googleAPIKey;
        let sRequestUrl = sBaseUrl + sAddress + sKey;
        let oPromise = new Promise((resolve,reject) => {
            request(sRequestUrl, (error, response, body) => {
                if (error) {
                    console.log('GoogleHelper Error:', error); // Print the error if one occurred
                    reject()
                }
                if (response && response.statusCode === 200) {
                    oResponse = JSON.parse(body);
                    if(oResponse.results[0] && 
                        oResponse.results[0].geometry &&
                        oResponse.results[0].geometry.viewport &&
                        oResponse.results[0].geometry.viewport.northeast){
                        this.lat = oResponse.results[0].geometry.viewport.northeast.lat;
                        this.lng = oResponse.results[0].geometry.viewport.northeast.lng;
                    }
                    resolve()
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
};
exports.googleHelper = googleHelper;

