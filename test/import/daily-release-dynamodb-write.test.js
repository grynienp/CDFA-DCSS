process.env.TABLE_NAME = 'dcss-local-test';
process.env.AWS_REGION = 'us-west-1';

const fs = require('fs');
const attr = require('dynamodb-data-types').AttributeValue;
const jsonTransform = require("../../src/import/daily-release-json-transform");
const dynamodbWriter = require("../../src/import/daily-release-dynamodb-write");
const util = require('../util');

const fileName = 'SLM_Release_20171109.txt';

beforeEach(() => {
    return util.delete('1').then(() => {
        return util.insert({
            id: "1",
            delinquent: true,
            releaseFileDate: ['20171108']
        });
    });
});

test('update record with daily release', (done) => {

    fs.createReadStream("test/import/daily-release-import-test-1.txt")
        .pipe(jsonTransform.transform())
        .pipe(dynamodbWriter.writer(fileName))
        .on('finish', () => {
            util.get('1').then((data) => {
                validate(data.Item);
                done();
            });
        });


    let validate = (data) => {
        data = attr.unwrap(data);
        console.log(data);
        //validating hydration of data, full data map is done in transform test
        expect(data.id).toBe("1");
        expect(data.delinquent).toBe(false);
        expect(data.releaseFileDate).toContain('20171108');
        expect(data.releaseFileDate).toContain('20171109');
    };
});




