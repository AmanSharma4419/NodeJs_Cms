var twilio = require('twilio');
var config = require('../config/configsetting.json');
var configTable = require('../models/config');
// Twilio Library


//console.log(config.twilio.twilioFrom);
module.exports.generateOTP = function () {
    var codelength = 4;
    return Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
}

module.exports.sendOtpSMS = function (mobileNumber, countryCode, message) {
    console.log("Inside sent otp", mobileNumber, countryCode);
    
    configTable.getTwillioSetting((err, resdata) => {

        //console.log("resdata", resdata);
        var from = config.twilio.twilioFrom;
        var accountSid = config.twilio.accountSid;
        var authToken = config.twilio.authToken;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.twilio.twilioFrom != '' && resdata.twilio.accountSid != '' && resdata.twilio.authToken != '') {
                from = resdata.twilio.twilioFrom;
                accountSid = resdata.twilio.accountSid;
                authToken = resdata.twilio.authToken;
            }
        }

        var client = new twilio(accountSid, authToken);

        client.messages.create({
            from: from,
            to: countryCode + mobileNumber,
            body: message,
        }).then((message) =>{/* console.log('otp send successfully to', countryCode)*/}).catch(error => {
            //console.log(error);
        });
    });
}

module.exports.sendOtpSMSCallback = function (data, callback) {

    configTable.getTwillioSetting((err, resdata) => {

        //console.log("resdata", resdata);
        var from = config.twilio.twilioFrom;
        var accountSid = config.twilio.accountSid;
        var authToken = config.twilio.authToken;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.twilio.twilioFrom != '' && resdata.twilio.accountSid != '' && resdata.twilio.authToken != '') {
                from = resdata.twilio.twilioFrom;
                accountSid = resdata.twilio.accountSid;
                authToken = resdata.twilio.authToken;
            }
        }

        var client = new twilio(accountSid, authToken);

        client.messages.create({
            from: from,
            to: data.countryCode + data.mobileNumber,
            body: data.msg,
        }, callback);
    });
}

module.exports.sendpanicSMS = function (mobileNumber, countryCode, message) {

    configTable.getTwillioSetting((err, resdata) => {

        //console.log("resdata", resdata);
        var from = config.twilio.twilioFrom;
        var accountSid = config.twilio.accountSid;
        var authToken = config.twilio.authToken;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.twilio.twilioFrom != '' && resdata.twilio.accountSid != '' && resdata.twilio.authToken != '') {
                from = resdata.twilio.twilioFrom;
                accountSid = resdata.twilio.accountSid;
                authToken = resdata.twilio.authToken;
            }
        }

        var client = new twilio(accountSid, authToken);

        client.messages.create({
            from: from,
            to: countryCode + mobileNumber,
            body: message,
        }).then((res) =>{ /*console.log('panic msg send', res.sid)*/}).catch(error => {
            //console.log(error);
        });
    });
}
