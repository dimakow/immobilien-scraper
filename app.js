let cheerio = require('cheerio');

//https://www.immobilienscout24.de/Suche/S-T/P-1/Wohnung-Miete/Umkreissuche/Berlin_2dMitte_20_28Mitte_29/-/228105/2512493/-/1276003001046/5/2,00-/-/EURO--600,00?enteredFrom=one_step_search
let content;
let tableName = "adindex";
let urlPart1 = 'https://www.immobilienscout24.de/'
let urlPart2 = 'Suche/S-T/Wohnung-Miete/Umkreissuche/Berlin_2dMitte_20_28Mitte_29/-/228105/2512493/-/1276003001046/4/1,00-/-/EURO--500,00?enteredFrom=one_step_search'
let urlPart3 = 'Suche/S-T/Wohnung-Miete/Berlin/Berlin/Wedding-Wedding/3,00-/-/EURO--1500,00?enteredFrom=one_step_search'
let urlSearch = 'Wohnung-Miete/Umkreissuche/Berlin_2dMitte_20_28Mitte_29/-/228105/2512493/-/1276003001046/4/1,00-/-/EURO--500,00'
let search = 'Wohnung-Miete/Umkreissuche/Berlin_2dMitte_20_28Mitte_29/-/228105/2512493/-/1276003001046/5/1,00-/-/EURO--2000,00?enteredFrom=one_step_search';
let page = 1;
let urlPage = (page) => {
    return `https://www.immobilienscout24.de/Suche/S-T/P-${page}/${search}`};
let exposeUrlPart = 'https://www.immobilienscout24.de/expose/';

let urlHelper = require('./lib/urlHelper');
let dynamoDBHelper = require('./lib/dynamoDBHelper');
let exposeClass = require('./lib/exposeClass');

let iCounter = 0
let iCounterNew = 0

let fnCheckForNewItem = function(iExposeId) {
    iCounter++;
    return dynamoDBHelper.fnGetItemFromDB(iExposeId).then(data => {
        if(Object.keys(data).length === 0){
            iCounterNew++
            let oExpose = new exposeClass(iExposeId);
            return oExpose.fnSaveToDynamoDB(oExpose);
        } else {
            console.log('ExposeId ' + iExposeId + ' already on dynamoDB')
        }
        return
    })
}

let fnCheckBodyAndReturn = function(sBody, mExposeIds) {

    let $ = cheerio.load(sBody);

    $('.result-list__listing').each(function(i, elem) {
        let dataId = $(this).attr('data-id')
        mExposeIds.set(dataId, "")
    })
    return
}

let fnCheckBodyAndExtractExpose = (oExpose, body) => {
/*    let $ = cheerio.load(body)
    let ad = {
        'data-id': {
            N: elem
        },
        'rooms': {
            N: '0'
        },
        'level': {
            N: '0'
        },
        'levelMax': {
            N: '0'
        },
        'size': {
            N: '0'
        },
        'sizeUsable': {
            N: '0'
        },
        'rentWithoutCharges': {
            N: '0'
        },
        'rentCharges': {
            N: '0'
        },
        'rentTotal': {
            N: '0'
        },
        'adress': {
            S: '-'
        },
        'deactivated': {
            BOOL: false
        },
        'dateUpdated': {
            N: new Date().getTime().toString()
        },
        'dateDeactivated': {
            N: "0"
        },
        'analyzed': {
            BOOL: true
        }

    }

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

    if ($( '.status-message,.status-warning,.margin-top-l').text().match("Angebot wurde deaktiviert") === null &&
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
            ad.rooms = {
                N: nRooms[0]
            }
        }
        if (sLevelRegex.exec($(sLevelSelector).text().trim()) !== null) {
            nLevel = sLevelRegex.exec($(sLevelSelector).text().trim())[1]
            nLevelMax = sLevelRegex.exec($(sLevelSelector).text().trim())[2]
            ad.level = {
                N: nLevel
            }
            ad.levelMax = {
                N: nLevelMax
            }
        }
        if ($(sSizeSelector).text().match(sSizeRegEx) !== null) {
            nSize = $(sSizeSelector).text().match(sSizeRegEx)[0].replace(',', '.')
            ad.size = {
                N: nSize
            }
        }
        if ($(sSizeUsableSelector).text().match(sSizeUsableRegex) !== null) {
            nSizeUsable = $(sSizeUsableSelector).text().match(sSizeUsableRegex)[0].replace(',', '.')
            ad.sizeUsable = {
                N: nSizeUsable
            }
        }
        if (nRentWithoutCharges !== null) {
            ad.rentWithoutCharges = {
                N: nRentWithoutCharges[0]
            }
        }
        if (nRentCharges !== null) {
            ad.rentCharges = {
                N: nRentCharges[0]
            }
        }
        if (nRentTotal !== null) {
            ad.rentTotal = {
                N: nRentTotal[0]
            }
        }

        sAdress = $(sAdressSelector).prev().text().replace("(zur Karte)", "").trim()
        sZipcode = $(sAdressSelector).html().trim()
        ad.adress = {
            S: sAdress + sZipcode
        }

        ad.deactivated = {
            BOOL: false
        }
    } else {
        ad.deactivated = {
            BOOL: true
        }
        ad.dateDeactivated = {
            N: new Date().getTime().toString()
        }
    } */

    return dynamoDBHelper.fnSaveItemToDB(ad);

}

exports.myHandler = function(event, context) {
    iCounter = 0;
    iCounterNew = 0;
    console.log('Mode: ' + event.mode)
    switch (event.mode) {
        case "grabAll":
            urlHelper.fetchUrlBody(urlPage(2)).then(res => {

                let oReturnPromise = new Promise((resolve, reject) => {});
                let aPromise = [];

                let $ = cheerio.load(res);

                let index = 0;

                console.log($('#pageSelection').html())

                $('#pageSelection > .select').children().each(function(i, elem) {
                    console.log(i)
                    index = index + 1;

                    if (index > 100) {
                        return
                    }

                    page = i + 1

                    console.log(urlPage(page))
                    
                    aPromise.push(urlHelper.fetchUrlBody(urlPage(page)))

                })

                return Promise.all(aPromise).catch(err => console.log("Error: " + err))
            }).then(aBodies => {
                console.log("----------------------------------");
                console.log("Got all bodies, now checking them!");
                console.log("----------------------------------");
                let mExposeIds = new Map();
                let aPromises = [];
                aBodies.forEach(sBody => {
                    fnCheckBodyAndReturn(sBody, mExposeIds)
                })

                mExposeIds.forEach((sValue, iExposeId) => {
                    aPromises.push(fnCheckForNewItem(iExposeId))
                })

                return Promise.all(aPromises).catch(err => console.log("Error: " + err))

            }).then(() => {
                console.log("Total analyzed: " + iCounter + " / Total new: " + iCounterNew)
            })
            break;
        case "grabAllDetails":
            dynamoDBHelper.fnGetAllUnanylzedDataIds().then(data => {
                //data.splice(1, data.length - 1)
                data.forEach(oExpose => {
                    urlHelper.fetchUrlBody(exposeUrlPart + oExpose.dataId).then(body => {
                        oExpose.fnScrapeFromBody(body);
                        return oExpose.fnSaveToDynamoDB();
                        //fnCheckBodyAndExtractExpose(oExpose, body)
                    }).catch(err => {
                        console.log('Expose not found ' + oExpose.dataId)
                    })
                })
            })
            break;


    }
}
