/**
 * Envelope encrypts the json data, lazy initialize the data encryption key
 */
const {Transform} = require('stream');
const AWS = require('aws-sdk');
const region = process.env.AWSREGION || 'us-west-1';
const kms = new AWS.KMS({apiVersion: '2014-11-01', region});
const crypto = require('crypto');

const NOT_ENCRYPTED = ["id", "fourMonthFlag"];

module.exports = {
    transform: function (keyAlias) {


        return new Transform({
            keyAlias: keyAlias,
            key: null,
            cipherKey: null,
            objectMode: true,
            transform(chunk, encoding, callback) {

                let encrypt = (data) => {
                    Object.keys(data).forEach((key, index) => {
                        if (!NOT_ENCRYPTED.includes(key)) {
                            let cipher = crypto.createCipher('aes256', this.key);
                            let encrypted = cipher.update(data[key], 'utf8', 'hex');
                            encrypted += cipher.final('hex');
                            data[key] = encrypted;
                        }
                    });
                    data.cipherKey = this.cipherKey;
                    return data;
                };

                if (!this.key) {
                    let params = {
                        KeyId: "alias/" + keyAlias,
                        KeySpec: "AES_256"
                    };
                    kms.generateDataKey(params).promise()
                        .then((data) => {
                            console.log(data);
                            this.cipherKey = data.CiphertextBlob;
                            this.key = data.Plaintext;

                            this.push(encrypt(chunk));
                            callback();
                        })
                        .catch(function (err) {
                            console.log(err);
                            callback(err);
                        });
                } else {
                    this.push(encrypt(chunk));
                    callback();
                }
            }
        });
    }
};