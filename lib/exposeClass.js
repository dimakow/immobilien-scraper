const util = require('util');
let cheerio = require('cheerio');
let dynamoDBHelper = require('./dynamoDBHelper')

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

    this.fnScrapeFromBody = function(body){

        let $ = cheerio.load(body)

        let sRoomsRegEx = /\d+/
        let sRoomsSelector = '.is24qa-zimmer'
        let sSizeRegEx = /(\d*,\d*)|(\d+)/
        let sSizeSelector = '.is24qa-wohnflaeche-ca'
        let sSizeUsableRegex = /(\d*,\d*)|(\d+)/
        let sSizeUsableSelector = '.is24qa-nutzflaeche-ca'
        let sRentWithoutChargesRegEx = /\d+/
        let sRentWithoutChargesSelector = '.is24qa-kaltmiete'
        let sRentChargesRegex = /\d+/
        let sRentChargesSelector = '.is24qa-nebenkosten'
        let sRentTotalRegex = /\d+/
        let sRentTotalSelector = '.is24qa-gesamtmiete'
        let sLevelRegex = /(\d) von (\d)/
        let sLevelSelector = '.is24qa-etage'
        let sAdressSelector = '.zip-region-and-country'

        if ($('.status-message,.status-warning,.margin-top-l').text().match("Angebot wurde deaktiviert") === null &&
            $('.status-message,.status-warning,.margin-top-l').text().match("Angebot nicht gefunden") === null) {

            let nRooms = $(sRoomsSelector).text().match(sRoomsRegEx)
            let nLevel
            let nLevelMax
            let nSize
            let nSizeUsable
            let nRentWithoutCharges = $(sRentWithoutChargesSelector).text().match(sRentWithoutChargesRegEx)
            let nRentCharges = $(sRentChargesSelector).text().match(sRentChargesRegex)
            let nRentTotal = $(sRentTotalSelector).text().match(sRentChargesRegex)
            let sAdress
            let sZipcode

            if (nRooms !== null) {
                this.rooms = parseInt(nRooms[0]);
            }
            if (sLevelRegex.exec($(sLevelSelector).text().trim()) !== null) {
                nLevel = sLevelRegex.exec($(sLevelSelector).text().trim())[1]
                nLevelMax = sLevelRegex.exec($(sLevelSelector).text().trim())[2]
                this.level = parseInt(nLevel);
                this.levelMax = parseInt(nLevelMax);
            }
            if ($(sSizeSelector).text().match(sSizeRegEx) !== null) {
                nSize = $(sSizeSelector).text().match(sSizeRegEx)[0].replace(',', '.')
                this.size = parseFloat(nSize);
            }
            if ($(sSizeUsableSelector).text().match(sSizeUsableRegex) !== null) {
                nSizeUsable = $(sSizeUsableSelector).text().match(sSizeUsableRegex)[0].replace(',', '.')
                this.sizeUsable = parseFloat(nSizeUsable);
            }
            if (nRentWithoutCharges !== null) {
                this.rentWithoutCharges = parseFloat(nRentWithoutCharges[0]);
            }
            if (nRentCharges !== null) {
                this.rentCharges = parseFloat(nRentCharges[0]);
            }
            if (nRentTotal !== null) {
                this.rentTotal = parseFloat(nRentTotal[0]);
            }

            sAdress = $(sAdressSelector).prev().text().replace("(zur Karte)", "").trim()
            sZipcode = $(sAdressSelector).html().trim()
            this.adress = sAdress + sZipcode;

            this.deactivated = false;
        } else {
            this.deactivated = true;
            this.dateDeactivated = new Date().valueOf();
        }

        this.analyzed = true;
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