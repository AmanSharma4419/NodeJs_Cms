var moment = require('moment-timezone');
var Promos = require('../models/promocodes');
var mailgunSendEmail = require('../lib/mailgunSendEmail.js');
var geolib = require('geolib');
var error_message = require('./errorMessages.json');
var errmodel = require('../models/errortable');
var User = require('../models/userTable');

module.exports = {

    checkRequestParams: (request_data_body, params_array, response) => {
        var missing_param = '';
        var is_missing = false;
        var invalid_param = '';
        var is_invalid_param = false;
        if (request_data_body) {
            params_array.forEach(function (param) {
                //console.log(param.name)
                if (request_data_body[param.name] == undefined) {
                    missing_param = param.name;
                    is_missing = true;
                } else {

                    if (typeof request_data_body[param.name] !== param.type) {
                        is_invalid_param = true;
                        invalid_param = param.name;
                    }
                }
            });

            if (is_missing) {
                //console.log("missing")
                response({ status: false, error_code: error_message.ERROR_CODE_PARAMETER_MISSING, message: missing_param + ' parameter missing!' });
            } else if (is_invalid_param) {
                //console.log("invaid param")
                response({ status: false, error_code: error_message.ERROR_CODE_PARAMETER_INVALID, message: invalid_param + ' parameter invalid data type!' });
            }
            else {
                response({ status: true });
            }
        }
        else {
            response({ status: true });
        }
    },

    getDistanceFromTwoLocation: (fromLocation, toLocation) => {

        var lat1 = fromLocation[0];
        var lat2 = toLocation[0];
        var lon1 = fromLocation[1];
        var lon2 = toLocation[1];

        ///////  TOTAL DISTANCE ////

        var R = 6371; // km (change this constant to get miles)
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    tokenGenerator: (length) => {

        if (typeof length == "undefined")
            length = 32;
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        return token;

    },

    generatorRandomChar: (length) => {

        if (typeof length == "undefined")
            length = 2;
        var token = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < length; i++)
            token += possible.charAt(Math.floor(Math.random() * possible.length));
        return token;
    },

    getTimeDifferenceInDay: (endDate, startDate) => {

        var difference = 0;
        var startDateFormat = moment(startDate, constant.DATE_FORMAT);
        var endDateFormat = moment(endDate, constant.DATE_FORMAT);
        difference = endDateFormat.diff(startDateFormat, 'days')
        difference = (difference.toFixed(2));

        return difference;
    },

    getTimeDifferenceInSecond: (endDate, startDate) => {

        var difference = 0;
        var startDateFormat = moment(startDate);
        var endDateFormat = moment(endDate);
        difference = endDateFormat.diff(startDateFormat, 'seconds')
        difference = (difference.toFixed(2));

        return difference;
    },

    getTimeDifferenceInMinute: (endDate, startDate) => {

        var difference = 0;
        var startDateFormat = moment(startDate);
        var endDateFormat = moment(endDate);
        difference = endDateFormat.diff(startDateFormat, 'minutes')
        difference = Math.round(difference);
        return difference;
    },

    showParamsErrorResponse: (message) => {
        var resData = { "status": "failure", "status_code": 200, "error_code": 5001, "error_description": "Missing Params or Params data type error!", "message": message, "data": {}, "error": {} };
        return resData;
    },

    showValidationErrorResponse: (message) => {
        var resData = { "status": "failure", "status_code": 200, "error_code": 5002, "error_description": "Validation Error!", "message": __(message), "data": {}, "error": {} };
        return resData;
    },

    showInternalServerErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5003, "error_description": "Internal Coding error or Params Undefined!", "message": message, "data": {}, "error": {} };
            return resData;
        /*})*/
        
    },

    showUnathorizedErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5004, "error_description": "Invalid Login Credential!", "message": __(message), "data": {}, "error": {} };
            return resData;
        /*});*/
        
    },

    showDatabaseErrorResponse: (message, error) => {
        /*errmodel.addError(error,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5005, "error_description": "Database error!", "message": __(message), "data": {}, "error": error };
            return resData;
        /*}); */
    },

    showAWSImageUploadErrorResponse: (message, error) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5006, "error_description": "AWS error!", "message": __(message), "data": {}, "error": error };
            return resData;
        /*});*/
       
    },

    showTwillioErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5007, "error_description": "Twillio Api Error!", "message": message, "data": {}, "error": {} };
            return resData;
        /*});*/
       
    },

    showGoogleMapsErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5008, "error_description": "Google Maps Api Error!", "message": message, "data": {}, "error": {} };
            return resData;
        /*});  */
    },

    showStripeErrorResponse: (message, code) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 5009, "stripe_error_code": code, "error_description": "Stripe Api Error!", "message": message, "data": {}, "error": {} };
            return resData;
        /*});*/
       
    },

    showSquareErrorResponse: (message) => {
        /*errmodel.addError(message,function(err,data){*/
            var resData = { "status": "failure", "status_code": 200, "error_code": 50010, "error_description": "Square Api Error!", "message": message, "data": {}, "error": {} };
            return resData;
        /*});  */ 
    },

    showSuccessResponse: (message, data) => {
        var resData = { "status": "success", "status_code": 200, "message": __(message), "data": data };
        return resData;
    },
    showSuccessResponseCount: (message, data, count) => {
        var resData = { "status": "success", "status_code": 200, "message": __(message), "data": data, "totalcount":count };
        return resData;  
    },

    getAge: (dob) => {

        var DOBFD = moment(dob, 'YYYYMMDD');

        var age = moment().diff(DOBFD, 'years');

        return age;
    },

    isValidDate: (date, format) => {

        var validDateFormat = moment(date, format).isValid();

        return validDateFormat;
    },

    getCurrentDateAndTimeInCityTimezoneFromUTC: (cityTimezone) => {

        var a = moment.tz(new Date(), cityTimezone);

        return a;
    },

    getDateAndTimeInCityTimezone: (date, cityTimezone) => {

        var a = moment.tz(date, cityTimezone);

        return a;
    },

    checkSurgeTime: (timezone, surgeHours) => {
        var isSurgeTime = "no";
        var surgeMultiplier = 0;

        var CurrentCityTime = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(timezone);
        var currentDay = CurrentCityTime.day();
        var currentDate = CurrentCityTime.format('YYYY-MM-DD');
        var currentTimeUTC = new Date(CurrentCityTime.utc().format());
        var currentTimeTimestamp = currentTimeUTC.getTime();

        for (var i = 0; i < surgeHours.length; i++) {

            var dayStatus = surgeHours[i].dayStatus;
            var day = surgeHours[i].day;

            var startTime = surgeHours[i].startTime;
            var startTimeSplit = startTime.split(":");
            var startTimeHour = startTimeSplit[0];
            var startTimeMinute = startTimeSplit[1];
            var startTimeStructure = currentDate + " " + startTimeHour + ":" + startTimeMinute;
            var startTimeByTimezone = helper.getDateAndTimeInCityTimezone(startTimeStructure, timezone);
            //console.log("startTimeByTimezone", startTimeByTimezone.format('LLLL'));
            var startTimeUTC = new Date(startTimeByTimezone.utc().format());
            var startTimeTimestamp = startTimeUTC.getTime();

            var endTime = surgeHours[i].endTime;
            var endTimeSplit = endTime.split(":");
            var endTimeHour = endTimeSplit[0];
            var endTimeMinute = endTimeSplit[1];
            var endTimeStructure = currentDate + " " + endTimeHour + ":" + endTimeMinute;
            var endTimeByTimezone = helper.getDateAndTimeInCityTimezone(endTimeStructure, timezone);
            //console.log("endTimeByTimezone", endTimeByTimezone.format('LLLL'));
            var endTimeUTC = new Date(endTimeByTimezone.utc().format());
            var endTimeTimestamp = endTimeUTC.getTime();
            var surgeMultipliers = surgeHours[i].surgeMultiplier;

            if (dayStatus === "yes" && currentDay === day && currentTimeTimestamp > startTimeTimestamp && currentTimeTimestamp < endTimeTimestamp) {
                isSurgeTime = "yes";
                surgeMultiplier = surgeMultipliers;
                break;
            }

        }

        return { isSurgeTime: isSurgeTime, surgeMultiplier: surgeMultiplier };
    },

    roundNumber: (num) => {
        return Math.round(num * 100) / 100;
    },

    caculateTripEstimatedCost: (distance, time, element) => {
        var isSurgeTime = "no";
        var surgeMultiplier = 0;
        var estimatedCost = 0;
        var unit = '';
        //distance in km default

        if (element.isSurgeTime === "yes") {
            if (element.surgeTimeList.length > 0) {
                var surgeCheck = helper.checkSurgeTime(element.cityDetails.cityTimezone, element.surgeTimeList);
                isSurgeTime = surgeCheck.isSurgeTime;
                surgeMultiplier = surgeCheck.surgeMultiplier;
            }
        }

        if (element.unit === "km") {

            var baseDistancePrice = element.distanceForBaseFare * element.basePrice;
            var leftDistance = distance - element.distanceForBaseFare;
            var leftDistancePrice = element.pricePerUnitDistance * leftDistance;
            var totalDistancePrice = baseDistancePrice + leftDistancePrice;
            var totalTimePrice = element.pricePerUnitTimeMinute * time;
            var totalPrice = totalDistancePrice + totalTimePrice;
            unit = 'km';
            estimatedCost = helper.roundNumber(totalPrice);

            if (estimatedCost < element.minimumFare) {
                estimatedCost = element.minimumFare;
            }

            if (isSurgeTime === "yes") {
                estimatedCost = helper.roundNumber(estimatedCost * surgeMultiplier);
            }

        } else if (element.unit === "mile") {

            distance = distance * 0.621371192; //distance in miles
            var baseDistancePrice = element.distanceForBaseFare * element.basePrice;
            var leftDistance = distance - element.distanceForBaseFare;
            var leftDistancePrice = element.pricePerUnitDistance * leftDistance;
            var totalDistancePrice = baseDistancePrice + leftDistancePrice;
            var totalTimePrice = element.pricePerUnitTimeMinute * time;
            var totalPrice = totalDistancePrice + totalTimePrice;
            unit = 'km';
            estimatedCost = helper.roundNumber(totalPrice);

            if (estimatedCost < element.minimumFare) {
                estimatedCost = element.minimumFare;
            }

            if (isSurgeTime === "yes") {
                estimatedCost = helper.roundNumber(estimatedCost * surgeMultiplier);
            }

        }

        return { isSurgeTime: isSurgeTime, surgeMultiplier: surgeMultiplier, unit: unit, estimatedCost: estimatedCost, distance: helper.roundNumber(distance) };
    },

    calculateTripFare: async(distance, time, estimatedCost, isSurgeTime, surgeMultiplier, promoCode, element) => {

        var driverEarning = 0;
        var promoCodeCost = 0;
        var costBeforePromo = 0;
        var adminEarning = 0;

        var baseDistancePrice = element.distanceForBaseFare * element.basePrice;
        var leftDistance = distance - element.distanceForBaseFare;
        var leftDistancePrice = element.pricePerUnitDistance * leftDistance;
        var totalDistancePrice = baseDistancePrice + leftDistancePrice;
        var totalTimePrice = element.pricePerUnitTimeMinute * time;
        var cost = helper.roundNumber(totalDistancePrice + totalTimePrice);

        if (cost < element.minimumFare) {
            cost = element.minimumFare;
        }

        if (isSurgeTime === "yes") {
            cost = helper.roundNumber(cost * surgeMultiplier);
        }

        if (cost < estimatedCost) {
            cost = estimatedCost;
        }

        costBeforePromo = cost;

        if (promoCode != "none") {
            var checkPromoCode = await helper.calculatePromoCodeDiscount(costBeforePromo, promoCode);
            //console.log("checkPromoCode", checkPromoCode);
            promoCodeCost = checkPromoCode.promoCodeCost;
            cost = checkPromoCode.cost;
        }

        driverEarning = helper.roundNumber((cost * Number(element.driverPercentCharge)) / 100);
        adminEarning = helper.roundNumber(cost - driverEarning);

        return { costBeforePromo: costBeforePromo, cost: cost, adminEarning: adminEarning, driverEarning: driverEarning, promoCodeCost: promoCodeCost };

    },

    calculatePromoCodeDiscount: async (cost, promoCode) => {

        var promoCodeCost = 0;

        var promocode = await Promos.findpromocodea({ promoCode: promoCode });
        if (!promocode || promocode === null || promocode === undefined) {
            promoCodeCost = 0;
        } else {

            if (promocode.type === 'Flat') {
                cost = cost - promocode.amount;
                promoCodeCost = promocode.amount;
            }

            if (promocode.type === 'Percent') {

                var subt = cost / promocode.amount;

                if (subt > promocode.maxAmount) {
                    subt = promocode.maxAmount;
                }
                promoCodeCost = subt;
                cost = cost - subt;
            }

            promoCodeCost = helper.roundNumber(promoCodeCost);
            cost = helper.roundNumber(cost);

        }

        return { cost: cost, promoCodeCost: promoCodeCost };
    },

    sendPushNotificationCustomer: (title, body, registrationToken) => {

        var payload = {
            notification: {
                title: title,
                body: body,
                sound: "default"
            }
        };

        admin.messaging().sendToDevice(registrationToken, payload)
            .then((response) => {
                // Response is a message ID string.
                //console.log(title + ' firebase sent message:', response);
            })
            .catch((error) => {
                console.log('Firebase Error sending message:', error);
            });
    },

    sendPushNotificationDriver: (title, body, registrationToken) => {

        var driverFDB = app.get("driverFDB");

        var payload = {
            notification: {
                title: title,
                body: body,
                sound: "default"
            }
        };

        admin.messaging(driverFDB).sendToDevice(registrationToken, payload)
            .then((response) => {
                // Response is a message ID string.
                //console.log(title + ' firebase sent message:', response);
            })
            .catch((error) => {
                console.log('Firebase Error sending message:', error);
            });
    },

    emitCustomerSocket: (socketId, data) => {
        var io = app.get('socketio');
        //console.log("trip_customer_socket hit!!", );
        io.to(socketId).emit('trip_customer_socket', data);
    },

    emitDriverSocket: (socketId, data) => {
        var io = app.get('socketio');
        //console.log("trip_driver_socket hit!!", );
        io.to(socketId).emit('trip_driver_socket', data);
    },

    sendCompleteTripEmailToDriverAndCustomer: async (costbeforPromo, datad) => {

        var eBody = '';

        eBody += '<div style="padding: 20px;">';
        eBody += '<h1 style="display: inline-block; width: 100%;margin-bottom: 0;"><strong style="float: left;">Total Cost: </strong>';
        eBody += '<strong style="float: right;"> $' + costbeforPromo + '</strong>';
        eBody += '</h1>';

        eBody += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        eBody += '<p style="font-size: 20px;margin-top: 0px; margin-bottom:25px; float: left;">Thanks For Travelling with us:' + datad.customerName + '</p>';

        eBody += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;width: 100%;">';

        eBody += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBody += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> Driver: </strong>';
        eBody += '<span style="display: table-cell;float: right;">' + datad.driverName + '</span>';
        eBody += '</p>';

        eBody += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBody += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> Car Type: </strong>';
        eBody += '<span style="display: table-cell;float: right;"> ' + datad.carTypeRequired.carType + ': ' + datad.driverSelectedCar.carName + '</span>';
        eBody += '</p>';

        eBody += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBody += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> Starting Point: </strong>';
        eBody += '<span style="display: table-cell;float: right;">' + datad.startLocationAddr + '</span>';
        eBody += '</p>';

        eBody += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBody += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> End Point: </strong>';
        eBody += '<span style="display: table-cell;float: right;">' + datad.endLocationAddr + '</span>';
        eBody += '</p>';

        eBody += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        eBody += '<p style="font-size: 20px;margin: 16px 0;display: table;float: left;float: left;">Bill Details</p>';

        eBody += '<p style="font-size: 20px;margin: 16px 0;display: table;width: 100%;float: left;">Your trip: <span style="font-size: 22px; float: right;">$' + costbeforPromo + '</span></p>';

        eBody += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        if (datad.promoCodeCost != 0) {
            eBody += '<p style="font-size: 20px;margin: 16px 0;display: table;width: 100%;float: left;">Discount: <span style="font-size: 22px; float: right;">$' + Math.round(datad.promoCodeCost * 100) / 100 + '</span></p>';
        }

        eBody += '<p style="font-size: 20px;margin: 16px 0; display: table;width: 100%;float: left;">';
        eBody += '<strong>Total Bill: </strong>';
        eBody += '<strong style="font-size: 22px; float: right;">$' + Math.round(datad.cost * 100) / 100 + '</strong>';
        eBody += '</p>';

        eBody += '</div>';

        // var mTemplate =  await MailTemplate.findOne({title:'CUSTOMER_TRIP_COMPLETED'});
        //console.log(mTemplate);
        if (eBody != null) {
            //var msg = mTemplate.body.replace('XXXXXX',resdata.name);
            try {
                var msg = eBody;
                var customere = await User.findOne({ _id: datad.customerId });
                var senemail = await mailgunSendEmail.sendEmail(customere.email, __('TRIP_COMPLETE_EMAIL_SUBJECT', constant.APP_NAME), msg);
                //console.log(senemail); 
            } catch (e) {
                console.log('error in sending email!!!!!!!!!!111', e);
            }
        }


        //email to driver
        var eBodys = '';

        eBodys += '<div style="padding: 20px;">';
        eBodys += '<h1 style="display: inline-block; width: 100%;margin-bottom: 0;"><strong style="float: left;">Total Cost: </strong>';
        eBodys += '<strong style="float: right;"> $' + costbeforPromo + '</strong>';
        eBodys += '</h1>';

        eBodys += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        eBodys += '<p style="font-size: 20px;margin-top: 0px; margin-bottom:25px; float: left;">Thanks For Travelling with us:' + datad.driverName + '</p>';

        eBodys += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;width: 100%;">';

        eBody += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBody += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> Customer: </strong>';
        eBody += '<span style="display: table-cell;float: right;">' + datad.customerName + '</span>';
        eBody += '</p>';

        eBodys += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBodys += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> Starting Point: </strong>';
        eBodys += '<span style="display: table-cell;float: right;">' + datad.startLocationAddr + '</span>';
        eBodys += '</p>';

        eBodys += '<p style="font-size: 20px; margin: 16px 0; display: table; width: 100%;float: left;">';
        eBodys += '<strong style="display: table-cell; vertical-align: top; padding-right: 35px;width: 135px;"> End Point: </strong>';
        eBodys += '<span style="display: table-cell;float: right;">' + datad.endLocationAddr + '</span>';
        eBodys += '</p>';

        eBodys += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        eBodys += '<p style="font-size: 20px;margin: 16px 0;display: table;float: left;float: left;">Bill Details</p>';

        eBodys += '<p style="font-size: 20px;margin: 16px 0;display: table;width: 100%;float: left;">Your trip: <span style="font-size: 22px; float: right;">$' + costbeforPromo + '</span></p>';

        eBodys += '<hr style="margin-top: 25px; margin-bottom: 25px; border-color:#f9f9f9;float: left;width: 100%;">';

        if (datad.promoCodeCost != 0) {
            eBodys += '<p style="font-size: 20px;margin: 16px 0;display: table;width: 100%;float: left;">Discount: <span style="font-size: 22px; float: right;">$' + Math.round(datad.promoCodeCost * 100) / 100 + '</span></p>';
        }

        eBodys += '<p style="font-size: 20px;margin: 16px 0; display: table;width: 100%;float: left;">';
        eBodys += '<strong>Total Bill: </strong>';
        eBodys += '<strong style="font-size: 22px; float: right;">$' + Math.round(datad.cost * 100) / 100 + '</strong>';
        eBodys += '</p>';

        eBodys += '</div>';

        if (eBodys != null) {
            //var msg = mTemplate.body.replace('XXXXXX',resdata.name);
            try {
                var msgs = eBodys;
                var senemail = await mailgunSendEmail.sendEmail(datad.driveremail, __('TRIP_COMPLETE_EMAIL_SUBJECT', constant.APP_NAME), msgs);
                //console.log(senemail); 
            } catch (e) {
                console.log('error in sending email!!!!!!!!!!', e);
            }

        }
    },

    sendNotificationDriver: async(data) => {
        //console.log("Notification Data", data);
        try {
            var messages = [];
            if (data.length > 0) {
                data.forEach((element) => {
                    element = JSON.parse(JSON.stringify(element));
                    if (element.token != '') {
                        messages.push({
                            notification: { title: element.notification.title, body: element.notification.body },
                            token: element.token,
                        });
                    }
                });
            }
            try {
                var driverFDB = app.get("driverFDB");
                admin.messaging(driverFDB).sendAll(messages).then((response) => {
                    console.log('Message Successfully sent message:', response);
                }).catch((error) => {
                    console.log('Message  Error sending message:', error);
                });
            } catch (error) {
                console.log("errordddsssss", error);
            }
            return { status: 1, message: 'Message Send successfully.' };
        } catch (error) {
            console.log("error", error);
            return { status: 0, message: 'Unable to Send notification.' };
        }
    },

    sendNotificationCustomer: async (data) => {
        //console.log("Notification Data", data);
        try {
            var messages = [];
            if (data.length > 0) {
                data.forEach((element) => {
                    element = JSON.parse(JSON.stringify(element));
                    if (element.token != '') {
                        messages.push({
                            notification: { title: element.notification.title, body: element.notification.body },
                            token: element.token,
                        });
                    }
                });
            }

            try {
                admin.messaging().sendAll(messages).then((response) => {
                        console.log('Message Successfully sent message:', response);
                    }).catch((error) => {
                        console.log('Message  Error sending message:', error);
                    });
            } catch (error) {
                console.log("errordddsssss", error);
            }
            return { status: 1, message: 'Message Send successfully.' };
        } catch (error) {
            console.log("error", error);
            return { status: 0, message: 'Unable to Send notification.' };
        }
    },

    checkLocationExitsBetweenSourceDestination: (point, lineStart, lineEnd) => {

        var checkLatLng = geolib.isPointInLine(
            { latitude: data.startLocation.coordinates[1], longitude: data.startLocation.coordinates[0] },
            { latitude: 0, longitude: 0 },
            { latitude: 0, longitude: 15 }
        );

        return checkLatLng;
    }
}