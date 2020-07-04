const User = require('../models/userTable');
const Driver = require('../models/drivertable');
const Trips = require('../models/triptable');

module.exports = function (socket) {

    socket.on('driversocket', (data, acknowledgement) => {
        try {
            socket.type = "driver";
            data.socketId = socket.id;

            if (data.angle == undefined) {
                data.angle = 0;
            }

            console.log("driversocket", data);

            if (data.driverId != undefined && data.driverId != '' && data.driverId != null && data.driverLocation != undefined && data.angle != undefined) {

                if(data.driverLocation.lng != 0 && data.driverLocation.lat != 0){

                    data.driverLocation = { type: "Point", coordinates: [data.driverLocation.lng, data.driverLocation.lat] };

                    Driver.addDriverSocket(data, async(err, verifydata) => {
                        if (err) {
                            //console.log("Driver socket error");
                        } else {
                            if (verifydata.driverStatus === constant.TRIP_ON_TRIP || verifydata.driverStatus === constant.TRIP_PICKUP_INROUTE) {
    
                                var tripStatus = '';
    
                                if (verifydata.driverStatus === constant.TRIP_ON_TRIP) {
                                    tripStatus = constant.TRIP_DESTINATION_INROUTE;
                                } else {
                                    tripStatus = constant.TRIP_PICKUP_INROUTE;
                                }
    
                                var tripRequestSocketData = {
                                    success: true,
                                    tripId: verifydata.currentTripId,
                                    tripStatus: tripStatus,
                                    driverStatus: verifydata.driverStatus,
                                    driverLocation: data.driverLocation,
                                    angle: data.angle
                                }
    
                                acknowledgement(tripRequestSocketData);
    
                                User.findCSocket(verifydata.currentTripId, (err, customerSocketData) => {
                                    if (err || customerSocketData === null) {
                                        //console.log("customerSocketData", customerSocketData);
                                    } else {
                                        if (customerSocketData.socketStatus === "no") {
                                           // console.log("trip_customer_socket hit in on trip");
                                            var tripRequestSocketDataC = {
                                                success: true,
                                                tripId: customerSocketData.currentTripId,
                                                tripStatus: constant.TRIP_DESTINATION_INROUTE,
                                                customerStatus: customerSocketData.customerStatus,
                                                driverLocation: data.driverLocation,
                                                angle: data.angle
                                            }
                                            helper.emitCustomerSocket(customerSocketData.socketId, tripRequestSocketDataC);
                                        }
                                    }
                                });
    
                            } else if (verifydata.driverStatus === constant.DRIVER_POOL_TRIPS) {
    
                                //console.log("on pool trip");
    
                                Trips.getDriverAllPoolTripsCallback(verifydata._id, (err, getPoolTrips) => {
                                    if (err) {
                                        //console.log("<<<<<<", err);
                                    } else {
                                        if (getPoolTrips.length > 0) {
    
                                            getPoolTrips.forEach(async element => {
    
                                               var customerSocketData = await User.findCSocketAsync(element.customerId);
    
                                               if(customerSocketData != null){
                                                    if (customerSocketData.socketStatus === "no") {
                                                        //console.log("trip_customer_socket hit in on trip");
                                                        var tripRequestSocketDataC = {
                                                            success: true,
                                                            tripId: element._id,
                                                            tripStatus: element.tripStatus,
                                                            customerStatus: customerSocketData.customerStatus,
                                                            driverLocation: data.driverLocation,
                                                            angle: data.angle
                                                        }
    
                                                        helper.emitCustomerSocket(customerSocketData.socketId, tripRequestSocketDataC);
                                                    }
                                               }
                                                
                                            });
    
                                        }
                                    }
                                });
    
                                if(data.fromConnect){
    
                                    var finalTripId = await helper.sortDriverPoolTrips(data.driverId, verifydata.driverLocation);
    
                                    console.log("finalTripId", finalTripId);
    
                                    var tripRequestSocketData = {
                                        success: true,
                                        tripId: finalTripId,
                                        tripStatus: constant.DRIVER_POOL_TRIPS,
                                        driverStatus: verifydata.driverStatus,
                                        driverLocation: data.driverLocation,
                                        angle: data.angle
                                    }
    
                                }else{
    
                                    var tripRequestSocketData = {
                                        success: true,
                                        tripId: null,
                                        tripStatus: constant.DRIVER_POOL_TRIPS,
                                        driverStatus: verifydata.driverStatus,
                                        driverLocation: data.driverLocation,
                                        angle: data.angle
                                    }
                                }
    
                                acknowledgement(tripRequestSocketData);
    
                            } else {
    
                                //FindingTrips
                                var isNewRequest = "no";
                                var timeLeft = 0;
                                var tripId = null;
    
                                if (verifydata.tripRequestTime != null) {
                                    var timeDiff = helper.getTimeDifferenceInSecond(new Date, verifydata.tripRequestTime);
    
                                    //console.log("timeDiff", timeDiff);
    
                                    if (timeDiff < 31) {
                                        tripId = verifydata.currentTripId;
                                        isNewRequest = "yes";
                                        timeLeft = 31 - timeDiff;
                                        timeLeft = (timeLeft.toFixed(2));
                                    }
                                }
    
                                var tripRequestSocketData = {
                                    success: true,
                                    tripId: tripId,
                                    tripStatus: constant.DRIVER_FINDING_TRIPS,
                                    driverStatus: verifydata.driverStatus,
                                    driverLocation: data.driverLocation,
                                    angle: data.angle,
                                    isNewRequest: isNewRequest,
                                    timeLeft: Number(timeLeft),
                                    isTripAccepted: verifydata.isTripAccepted
                                }
    
                                acknowledgement(tripRequestSocketData);
    
                            }
                        }
                    });

                }else{

                    var tripRequestSocketData = {
                        success: false,
                        tripId: null,
                        tripStatus: null,
                        customerStatus: null,
                        driverLocation: {},
                        isTripAccepted: null,
                        angle: 0,
                        message: "Missing required params!"
                    }
                    acknowledgement(tripRequestSocketData);
                    
                }
                
            } else {
                var tripRequestSocketData = {
                    success: false,
                    tripId: null,
                    tripStatus: null,
                    customerStatus: null,
                    driverLocation: {},
                    isTripAccepted: null,
                    angle: 0,
                    message: "Missing required params!"
                }
                acknowledgement(tripRequestSocketData);
            }
        }
        catch (err) {
            //console.log("driversocket err", err);
        }
    });

};