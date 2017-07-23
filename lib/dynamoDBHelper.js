let AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB({
    maxRetries: 30
});

AWS.events.on('retry', function(resp) {
    if (resp.error && resp.error.retryable) {
        var date = new Date();
        console.log(date, '| Retrying request for the ' + resp.retryCount + 'th time.');
        console.log(date, '| Retry triggered by', err.code, err.message);
    }
});

exports.fnSaveItemToDB = function(item) {
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.putItem({
            "TableName": "exposeIndex",
            "Item": item
        }, function(err, data) {
            if (err) {
                console.log('Error putting item into dynamodb failed: ' + err + ' /// ' + JSON.stringify(item));
                reject();
            } else {
                console.log('dynamoDBHelper: Saved following item: ' + JSON.stringify(item));
                resolve();
            }
        });
    })
    return oPromise;

    dynamodb.putItem({
        "TableName": "exposeIndex",
        "Item": item
    }, function(err, data) {
        if (err) {
            console.log('Error putting item into dynamodb failed: ' + err + ' /// ' + JSON.stringify(item));
        } else {
            console.log('dynamoDBHelper: Saved following item: ' + JSON.stringify(item));
        }
    });
}
exports.fnGetItemFromDB = function(dataId) {
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.getItem({
            Key: {
                "data-id": {
                    N: dataId
                }
            },
            TableName: 'exposeIndex'
        }, function(err, data) {
            if (err) {
                console.log('Error happened while getting: ' + dataId + ' from dynamoDB')
                console.log(err)
                reject()
            } else {
                resolve(data)
            }
        })
    })
    return oPromise

}
exports.fnGetAllDataIds = function() {
    let aIds = [];
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.scan({
            TableName: "exposeIndex"
        }, function(err, data) {
            if (err !== null) {
                console.log('dynamoDBHelper: Error while retrieving list of data-ids')
                console.log(err)
                reject()
            } else {
                data.Items.forEach(function(elem) {
                    aIds.push(elem['data-id'].N)
                })
                resolve(aIds)
            }

        })
    })
    return oPromise
}
