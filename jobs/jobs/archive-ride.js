const trips = require('../../models/triptable');
const Driver= require('../../models/drivertable');
const User = require('../../models/userTable.js');
const mailgunSendEmail = require('../../lib/mailgunSendEmail.js');
const otpVerification = require('../../lib/otpverification.js');
const basicSetting = require('../../config/basicsetting.json');
const stats = require('../../models/reports');

module.exports = function(agenda) {
    // defining the archive ride for the jobs in collection
    agenda.define('archive ride', async function(job, done) {
        // getting trip information
        trips.findOneAndUpdate({_id: job.attrs.data.rideId},
            { $set: { tripStatus: constant.TRIP_FINDING }}, async (err,datad) => {
            if(err|| datad == null) {
            }else{
                done();

                 var nearByData = {
                    startPoint: datad.startLocation,
                    radius: Number(basicSetting.App_Settings.Default_Search_Radius), // in meters
                    query: { driverStatus: constant.DRIVER_FINDING_TRIPS.toString(), selectedCarTypeId: datad.carTypeRequired.carTypeId.toString(), status: "approved", isRequestSend: "no" }
                }

               // console.log("Search Data schedule ride", nearByData);
                var results = await Driver.getNearByDrivers(nearByData);
                var data = {};

                var nearByTempDrivers = [];
                data.tripId = datad._id;

                if (results.length > 0) {

                    results.forEach(element => {
                        nearByTempDrivers.push(element._id);
                    });

                    data.nearByTempDrivers = nearByTempDrivers;
                    data.isDriverFound = "yes";

                } else {
                    data.nearByTempDrivers = [];
                    data.isDriverFound = "no";
                }

                trips.updateScheduleCronTrips(data,async(err,resdata) => {
                    //send request to all nearby drivers
                    if (resdata.isDriverFound === "yes") {
                        //TripC.sendRequestToNearByDrivers(resdata.nearByTempDrivers, resdata.customerName, resdata._id);
                        await Driver.updateMany({ _id: { $in: resdata.nearByTempDrivers } }, { "$set": { isRequestSend: "yes", isTripAccepted: "no", "currentTripId": data.tripId, tripRequestTime: new Date() } });

                        //console.log("in send request222");

                        //get drivers firebaseToken and socketId to send push notification and emit socket
                        Driver.getDriversByIds(resdata.nearByTempDrivers, (err, driversList) => {
                            driversList.forEach(dresponse => {

                                //send push notification
                                if (dresponse.firebaseToken != undefined && dresponse.firebaseToken != '' && dresponse.firebaseToken != null && dresponse.firebaseToken != "none") {
                                    var title = __('TRIP_REQUEST_SUCCESS');
                                    var body = 'Trip Request From :' + resdata.customerName;
                                    var registrationToken = dresponse.firebaseToken;
                                    helper.sendPushNotificationDriver(title, body, registrationToken);

                                    //console.log("Schedule Trip Request Send : " + data.tripId + " To Driver: " + dresponse._id);

                                    //add for driver analytics
                                    var sdata = {
                                        receivedRequest: 1,
                                        driverId: dresponse._id,
                                        tripId: data.tripId
                                    };

                                    stats.addRequestRec(sdata);
                                }

                                //emit socket if driver is connected to socket

                                if (dresponse.socketStatus === "no") {

                                    //console.log("send request socket hit");

                                    var tripRequestSocketData = {
                                        success: true,
                                        tripId: data.tripId,
                                        tripStatus: constant.DRIVER_FINDING_TRIPS,
                                        driverStatus: dresponse.driverStatus,
                                        driverLocation: dresponse.driverLocation,
                                        angle: 0,
                                        isNewRequest: "yes",
                                        isTripAccepted: "no"
                                    }

                                    helper.emitDriverSocket(dresponse.socketId, tripRequestSocketData);
                                }
                            });
                        });

                        setTimeout(async function () {
                            //console.log("in set time out");
                            await Driver.updateMany({ _id: { $in: resdata.nearByTempDrivers } }, { "$set": { isRequestSend: "no" } });
                        }, 32000);

                    }else{
                        var sub = constant.APP_NAME+ ' Scheduled Ride Cancellation :' + resdata.readableDate;
                        var msg = "Hi, Your '"+constant.APP_NAME+" Schedule Ride Has Been Cancelled Due To Driver Unavailability!";
                        var customere = await User.findOne({mobileNumber:resdata.customerNumber});
                        var senemail = await mailgunSendEmail.sendEmail(customere.email,sub,msg);
                        otpVerification.sendOtpSMS(resdata.customerNumber,customere.countryCode,msg);
                    }
                });
            }
        })
    });
};