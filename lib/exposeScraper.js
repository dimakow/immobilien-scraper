
let cheerio = require('cheerio');
exports.fnScrapeFromBodyAndReturnObject = function(body){
    let oReturn = {};
    let $ = cheerio.load(body)

    let sRoomsRegEx = /\d+/
    let sRoomsSelector = '.is24qa-zimmer'
    let sSizeRegEx = /(\d*,\d*)|(\d+)/
    let sSizeSelector = '.is24qa-wohnflaeche-ca'
    let sSizeUsableRegex = /(\d*,\d*)|(\d+)/
    let sSizeUsableSelector = '.is24qa-nutzflaeche-ca'
    let sRentWithoutChargesRegEx = /\d+.\d+/
    let sRentWithoutChargesSelector = '.is24qa-kaltmiete'
    let sRentChargesRegex = /\d+.\d+/
    let sRentChargesSelector = '.is24qa-nebenkosten'
    let sRentTotalRegex = /\d+.\d+/
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
            oReturn.rooms = parseInt(nRooms[0]);
        }
        if (sLevelRegex.exec($(sLevelSelector).text().trim()) !== null) {
            try {
                nLevel = sLevelRegex.exec($(sLevelSelector).text().trim())[1];
            } catch (error) {
                
            }
            try {
                nLevelMax = sLevelRegex.exec($(sLevelSelector).text().trim())[2];
            } catch (error) {
                
            }
            oReturn.level = parseInt(nLevel);
            oReturn.levelMax = parseInt(nLevelMax);
        }
        if ($(sSizeSelector).text().match(sSizeRegEx) !== null) {
            nSize = $(sSizeSelector).text().match(sSizeRegEx)[0].replace(',', '.')
            oReturn.size = parseFloat(nSize);
        }
        if ($(sSizeUsableSelector).text().match(sSizeUsableRegex) !== null) {
            nSizeUsable = $(sSizeUsableSelector).text().match(sSizeUsableRegex)[0].replace(',', '.')
            oReturn.sizeUsable = parseFloat(nSizeUsable);
        }
        if (nRentWithoutCharges !== null) {
            oReturn.rentWithoutCharges = parseFloat(nRentWithoutCharges[0].replace(",",""));
        }
        if (nRentCharges !== null) {
            oReturn.rentCharges = parseFloat(nRentCharges[0].replace(",",""));
        }
        if (nRentTotal !== null) {
            oReturn.rentTotal = parseFloat(nRentTotal[0].replace(",",""));
        }


        try {
            sAdress = $(sAdressSelector).prev().text().replace("(zur Karte)", "").trim()
        } catch (error) {
            
        }
        try {
            sZipcode = $(sAdressSelector).html().trim()
        } catch (error) {
            
        }
        
        oReturn.adress = sAdress + sZipcode;

        oReturn.deactivated = false;
    } else {
        oReturn.deactivated = true;
        oReturn.dateDeactivated = new Date().valueOf();
    }

    oReturn.analyzed = true;
    return oReturn;
};