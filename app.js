let cheerio = require('cheerio');
let AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB();

let content;
let tableName = "adindex";
let urlPart1 = 'https://www.immobilienscout24.de/'
let urlPart2 = 'Suche/S-T/Wohnung-Miete/Berlin/Berlin/Wedding-Wedding/2,00-/-/EURO--700,00?enteredFrom=one_step_search'

let urlHelper = require('./lib/urlHelper')
const fetchUrlBody = urlHelper.fetchUrlBody

let fnSaveItemToDB = function(item) {

    dynamodb.putItem({
        "TableName": tableName,
        "Item": item
    }, function(err, data) {
        if (err) {
            console.log('Error putting item into dynamodb failed: ' + err);
        } else {
            console.log('great success: ' + JSON.stringify(data, null, '  '));
        }
    });
}

let fnCheckBodyAndSaveItems = function(body) {
    let $ = cheerio.load(body)

    $('.result-list__listing').each(function(i, elem) {
        let ad = {
            'data-id': {
                N: $(this).attr('data-id')
            }

        }
        fnSaveItemToDB(ad);
    })
}

exports.myHandler = function(event, context) {

    switch (event.mode) {
        case "grabAll":
            fetchUrlBody(urlPart1 + urlPart2).then(function(res) {

                let $ = cheerio.load(res)

                $('#pageSelection > .select').children().each(function(i, elem) {

                    urlPart2 = $(this).attr('value')

                    console.log($(this).html())

                    urlPart2 = urlPart2.substring(1, urlPart2.length)

                    fetchUrlBody(urlPart1 + urlPart2).then(res => {
                        fnCheckBodyAndSaveItems(res)

                    })
                })
            })
        case "grabAllDetails":
    }
}
