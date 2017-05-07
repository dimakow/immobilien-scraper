let cheerio = require('cheerio');
let AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB();

let content;
let tableName = "adindex";
let urlPart1 = 'https://www.immobilienscout24.de/Suche/S-T'
let urlPart2 = '/Wohnung-Miete/Berlin/Berlin/Wedding-Wedding/2,00-/-/EURO--700,00?enteredFrom=one_step_search'

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

exports.myHandler = function(event, context) {

    fetchUrlBody(urlPart1 + urlPart2).then(function(res) {

        let $ = cheerio.load(res)

        $('.result-list__listing').each(function(i, elem) {
            let ad = {
                'data-id': {
                    N: $(this).attr('data-id')
                }

            }
            fnSaveItemToDB(ad);
        })
    })

}
