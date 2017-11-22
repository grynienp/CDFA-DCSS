const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({region: process.env.AWSREGION || 'us-west-1'});
const attr = require('dynamodb-data-types').AttributeValue;

module.exports = {

    get: function (id, timestamp) {
        let params = {
            Key: {
                "agencyCustomerId": {S: id},
                "timestamp": {S: timestamp}
                },
            TableName: process.env.ACTION_TABLE_NAME
        };
        return dynamodb.getItem(params)
            .promise()
            .then((data) => {
                return new Promise((resolve, reject) => {
                    resolve(attr.unwrap(data.Item));
                });
            });
    }
};