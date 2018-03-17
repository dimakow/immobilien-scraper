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
let oExposeScraper = require('./lib/exposeScraper');

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
            dynamoDBHelper.fnGetAllUnanylzedDataIds().then(aExposes => {
                let nTotalLength = aExposes.length;
                let nCurrentIndex = 0;
                let aAllExposePromises = [];
                aExposes.forEach(oExpose => {
                    let oPromise = new Promise((resolve,reject) => {
                        oExpose.fnAnalyze().then(() => {
                            oExpose.fnSaveToDynamoDB().then(() => {
                                nCurrentIndex = nCurrentIndex + 1;
                                console.log(nCurrentIndex + " / " + nTotalLength);
                                resolve();
                            });
                        }).catch(err => {
                            console.log(err);
                            nCurrentIndex = nCurrentIndex + 1;
                            console.log(nCurrentIndex + " / " + nTotalLength);
                            resolve();
                        })
                    });
                    aAllExposePromises.push(oPromise);
                })
                Promise.all(aAllExposePromises).then(() => {
                    console.log("---Finished---")
                })
            })
            break;
        case "grabMissing":

            dynamoDBHelper.fnGetAllAnaylzedDataIds().then(aExposes => {
                let nTotalLength = aExposes.length;
                let nCurrentIndex = 0;
                let aAllExposePromises = [];
                let fnWorkOnExposeArray = function(aExposes){
                    aExposes.forEach(oExpose => {
                        let oPromise = new Promise((resolve) => {
                            oExpose.fnAnalyze().then(() => {
                                oExpose.fnSaveToDynamoDB().then(() => {
                                    nCurrentIndex = nCurrentIndex + 1;
                                    console.log(nCurrentIndex + " / " + nTotalLength);
                                    resolve();
                                });
                            }).catch(err => {
                                console.log(err);
                                nCurrentIndex = nCurrentIndex + 1;
                                console.log(nCurrentIndex + " / " + nTotalLength);
                                resolve();
                            })
                        });
                        aAllExposePromises.push(oPromise);
                    })
                    Promise.all(aAllExposePromises).then(() => {
                        console.log("---Finished---")
                    })
                }
                let nCounter = 0;
                let nSize = 5;
                let nTimes = Math.ceil(aExposes.length / nSize );
                do{
                    let nWaitTime = nCounter * 10000;
                    let nStartIndex = nCounter * nSize;
                    let nEndIndex = nSize * ( nCounter + 1);
                    let aTmp = aExposes.slice(nStartIndex,nEndIndex);
                    setTimeout(function(){
                        fnWorkOnExposeArray(aTmp);
                    },nWaitTime)
                    nCounter = nCounter + 1;
                }
                while(nCounter < nTimes)
            })


    }
}
