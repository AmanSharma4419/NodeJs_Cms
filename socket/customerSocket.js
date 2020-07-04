const User = require('../models/userTable');

module.exports = function (socket) {

    socket.on('customersocket', (data, acknowledgement) => {
        try {
            data.socketId = socket.id;
            socket.type = "customer";
            if (data.customerId != undefined && data.customerId != '' && data.customerId != null) {
                User.addCustomerSocket(data, (err, verifydata) => {
                    if (err) {
                        //console.log("customer socket error");
                        var tripRequestSocketData = {
                            success: false,
                            customerId: verifydata._id,
                            tripId: null,
                            tripStatus: null,
                            customerStatus: null
                        }

                        acknowledgement(tripRequestSocketData);

                    } else {

                        
                        if (verifydata.customerStatus === constant.TRIP_ON_TRIP) {
                            var tripRequestSocketData = {
                                success: true,
                                customerId: verifydata._id,
                                tripId: verifydata.currentTripId,
                                tripStatus: constant.TRIP_DESTINATION_INROUTE,
                                customerStatus: verifydata.customerStatus
                            }

                            acknowledgement(tripRequestSocketData);

                        } else if (verifydata.customerStatus === constant.TRIP_WAITING_DRIVER) {
                            var tripRequestSocketData = {
                                success: true,
                                customerId: verifydata._id,
                                tripId: verifydata.currentTripId,
                                tripStatus: constant.TRIP_PICKUP_INROUTE,
                                customerStatus: verifydata.customerStatus
                            }

                            acknowledgement(tripRequestSocketData);

                        } else {
                            var isSearchingTrip = "no";
                            var timeLeft = 0;
                            var tripId = null;

                            if (verifydata.tripRequestTime != null) {
                                var timeDiff = helper.getTimeDifferenceInSecond(new Date, verifydata.tripRequestTime);

                                //console.log("timeDiff", timeDiff);

                                if (timeDiff < 31) {
                                    tripId = verifydata.currentTripId;
                                    isSearchingTrip = "yes";
                                    timeLeft = 31 - timeDiff;
                                    timeLeft = (timeLeft.toFixed(2));
                                }
                            }

                            var tripRequestSocketData = {
                                success: true,
                                customerId: verifydata._id,
                                tripId: tripId,
                                tripStatus: constant.TRIP_FINDING,
                                customerStatus: verifydata.customerStatus,
                                isSearchingTrip: isSearchingTrip,
                                timeLeft: Number(timeLeft)
                            }

                            acknowledgement(tripRequestSocketData);
                        }
                    }
                });
            }
        }
        catch (err) { }
    });

};