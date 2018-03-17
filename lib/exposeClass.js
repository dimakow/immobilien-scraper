const util = require('util');
let cheerio = require('cheerio');
let dynamoDBHelper = require('./dynamoDBHelper');
let oExposeScraper = require('./exposeScraper');
let googleHelper = require('./googleHelper')
let urlHelper = require('./urlHelper');

let logLevel = process.env.IMMO_LOG_LEVEL;
let exposeUrlPart = 'https://www.immobilienscout24.de/expose/';

function dynamoExpose(nId){
    this.dataId = parseInt(nId);
    this.dateCreated = new Date().valueOf();
    this.rooms = 0;
    this.level = 0;
    this.levelMax = 0;
    this.size = 0;
    this.sizeUsable = 0;
    this.rentWithoutCharges = 0;
    this.rentCharges = 0;
    this.rentTotal = 0;
    this.adress = '-';
    this.deactivated = false;
    this.dateUpdated = new Date().valueOf();
    this.dateDeactivated = 0;
    this.analyzed = false;

    this.fnFillFromDynamoDB = function(oElem){
        let aKeys = Object.keys(oElem);
        aKeys.forEach(elem => {
            if(oElem[elem].N){
                this[elem] = parseFloat(oElem[elem].N);
            }
            if(oElem[elem].S){
                this[elem] = oElem[elem].S;
            }
            if(oElem[elem].BOOL){
                this[elem] = oElem[elem].BOOL;
            }
        }); 
    };

    this.fnAnalyze = function(){
        let oPromise = new Promise((resolve,reject) => {
            urlHelper.fetchUrlBody(exposeUrlPart + this.dataId)
            .then(body => {             
                let oScrapedExpose = oExposeScraper.fnScrapeFromBodyAndReturnObject(body);
                let aKeys = Object.keys(oScrapedExpose);
                aKeys.forEach(elem => {
                    if(oScrapedExpose[elem]){
                        this[elem] = oScrapedExpose[elem];
                    }
                });
                //Now Google API stuff
                return googleHelper.fnGetCoordinates(this.adress);
            })
            .then((googleHelperReturn) => {
                if(logLevel === 2){
                    console.log("Got response from Google: " + this.dataId);
                }
                let aKeys = Object.keys(googleHelperReturn);
                aKeys.forEach(elem => {
                    if(googleHelperReturn[elem]){
                        this[elem] = googleHelperReturn[elem];
                    }   
                });
                resolve();
            })
            .catch(err => {
                if(err.msg === "notFound"){
                    this.deactivated = true;
                    this.dateDeactivated = new Date().valueOf();
                    resolve();
                } else {
                    reject(err);
                }
                
            })
        });
        return oPromise; 
    };

    this.fnSaveToDynamoDB = function(){
        let oExportObject = {};
        let aProperties = Object.keys(this);
        aProperties.forEach(property => {
            if(this.hasOwnProperty(property) && typeof(this[property]) !== "function"){
                if(typeof(this[property]) === "number"){
                    oExportObject[property] = {};
                    oExportObject[property].N = this[property].toString();
                }
                if(typeof(this[property]) === "string"){
                    oExportObject[property] = {};
                    oExportObject[property].S = this[property];
                }
                if(typeof(this[property]) === "boolean"){
                    oExportObject[property] = {};
                    oExportObject[property].BOOL = this[property];
                }
            }
            
        });
        return dynamoDBHelper.fnSaveItemToDB(oExportObject);
    }

/*     console.log(Object.keys(oElem));
    for(var property in oElem){
        if (oElem.hasOwnProperty(property)) {

            if(property.N){
                this[property] = oElem.property.N;
            }
            if(property.S){
                this[property] = oElem.property.S;
            }
            if(property.BOOL){
                this[property] = oElem.property.BOOL;
            }
            
        }
    } */
    //console.log("This is it: ");
    //console.log(util.inspect(this, false, null))
}
module.exports = dynamoExpose;