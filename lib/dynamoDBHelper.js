let AWS = require('aws-sdk');
let exposeClass = require('./exposeClass');
AWS.config.update({region: 'us-west-1'});

let logLevel = process.env.IMMO_LOG_LEVEL;

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
    if(logLevel === 2){
        console.log("Saving item: " + item.dataId.N );
    }
    
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.putItem({
            "TableName": "exposeIndex2",
            "Item": item
        }, function(err, data) {
            if (err) {
                console.log('Error putting item into dynamodb failed: ' + err + ' /// ' + JSON.stringify(item));
                reject();
            } else {
                if(logLevel === 2){
                    console.log('dynamoDBHelper: Saved following item: ' + JSON.stringify(item));
                }
                resolve();
            }
        });
    })
    return oPromise;
}
exports.fnGetItemFromDB = function(dataId) {
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.getItem({
            Key: {
                "dataId": {
                    N: dataId
                }
            },
            TableName: 'exposeIndex2'
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
            TableName: "exposeIndex2"
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

exports.fnGetAllUnanylzedDataIds = function() {
    let aExposes = [];
    let dYesteday = new Date();
    dYesteday.setDate(dYesteday.getDate() - 1);
    let sYesterday = dYesteday.valueOf().toString();
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.scan({
            TableName: "exposeIndex2",
            FilterExpression: "analyzed <> :boolean_true AND dateCreated > :yesterday AND deactivated <> :boolean_true",
            ExpressionAttributeValues: {
                ":boolean_true" : { BOOL : true },
                ":yesterday" : { N: sYesterday}
            } 
        }, function(err, data) {
            if (err !== null) {
                console.log('dynamoDBHelper: Error while retrieving list of data-ids')
                console.log(err)
                reject()
            } else {
                data.Items.forEach(function(elem) {
                    let oExpose = new exposeClass();
                    oExpose.fnFillFromDynamoDB(elem);
                    aExposes.push(oExpose);
                })
                resolve(aExposes)
            }

        })
    })
    return oPromise
}

exports.fnGetAllAnaylzedDataIds = function() {
    let aExposes = [];
    let dYesteday = new Date();
    dYesteday.setDate(dYesteday.getDate() - 1);
    let sYesterday = dYesteday.valueOf().toString();
    let oPromise = new Promise((resolve, reject) => {
        dynamodb.scan({
            TableName: "exposeIndex2",
            FilterExpression: "analyzed = :boolean_true",
            ExpressionAttributeValues: {
                ":boolean_true" : { BOOL : true }
            } 
        }, function(err, data) {
            if (err !== null) {
                console.log('dynamoDBHelper: Error while retrieving list of data-ids')
                console.log(err)
                reject()
            } else {
                data.Items = data.Items.slice(0,10);
                data.Items.forEach(function(elem) {
                    let oExpose = new exposeClass();
                    oExpose.fnFillFromDynamoDB(elem);
                    aExposes.push(oExpose);
                })
                
                resolve(aExposes)
            }

        })
    })
    return oPromise
}