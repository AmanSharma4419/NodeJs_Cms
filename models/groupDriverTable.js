var mongoose = require('mongoose');

var groupdriverSchema = mongoose.Schema({
    tripId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerRefId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    driverId: { type: String, required: true },
    driverRefId: { type: mongoose.Schema.Types.ObjectId, ref: 'driver' },
    tripStatus: { type: String, enum: ['searching', 'confirmed', 'inroute', 'started', 'completed', 'cancel', 'schedule'] },
    driverArrivedStatus: { type: String, enum: ["yes", "no"], default: "no" },
    tripOTP : {type: Number},
    cost : {type: Number, default: 0},
    driverEarning : {type:Number},
    tripConfirmedAt: { type: Date },
    driverInrouteAt : {type: Date},
    tripStartedAt: { type: Date },
    tripEndedAt: { type: Date },
    driverArrivedAt: { type: Date },
    canceled : { type: Date },
    driverWaitedUpto: { type: Date },
    review: {
        customerRating: { type: Number, default: 0 },
        driverRating: { type: Number, default: 0 },
        customerReview: { type: String, default: null },
        driverReview: { type: String, default: null },
        DSubAt: { type: Date, default: null },
        CSubAt: { type: Date, default: null },
        badRating: { type: String, default: "no" }
    },
    createdAt: { type: Date },
    updatedAt: { type: Date }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

const groupdriverTable = module.exports = mongoose.model('groupdriver', groupdriverSchema);

module.exports.addGroup = (data, callback) => {
    var query = { tripId: data.tripId, customerId: data.customerId, driverId: data.driverId };

    var update = {
        tripId: data.tripId,
        customerId: data.customerId,
        customerRefId: data.customerId,
        driverId: data.driverId,
        driverRefId: data.driverId,
        tripStatus: "confirmed",
        tripOTP : data.tripOTP,
        tripConfirmedAt : new Date(),
        driverArrivedStatus : "no",
        createdAt: new Date(),
        updatedAt: new Date()
    }

    groupdriverTable.findOneAndUpdate(query, update, { upsert: true, "new": true }, callback);
}

module.exports.getGroupById = (id, callback) => {
    groupdriverTable.findById(id, callback);
}
//get customer groupdriver
module.exports.getCustomerGroup = (data, callback) => {
    return groupdriverTable
        .find({ customerId: data.customerId })
        .populate({ path: 'driverRefId', select: 'name profileImage driverStatus' })
        .exec(callback);
}

module.exports.getUserGroup = (data, callback) => {
    return groupdriverTable.findOne({ customerId: data.customerId, driverId: data.driverId }, callback);
}

//get driver groupdriver
module.exports.getDriverGroup = (data, callback) => {
    return groupdriverTable
        .find({ driverId: data.driverId })
        .populate({ path: 'customerRefId', select: 'name profileImage customerStatus' })
        .exec(callback);
}

//update customer groupdriver window status
module.exports.updateUserGroupStatus = (data, callback) => {
    var query = { _id: data.groupdriverId };

    var update = {
        customerWindowStatus: data.customerWindowStatus,
        customerUnreadMessages: 0,
        updatedAt: new Date()
    }

    return groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.acceptDriver = (data, callback) => {
    var query = { tripId: data.tripId, customerId: data.customerId, driverId: data.driverId };

    // var update = {
    //     tripStatus: "confirmed",
    //     updatedAt: new Date()
    // }

    var update = {
        tripId: data.tripId,
        customerId: data.customerId,
        customerRefId: data.customerId,
        driverId: data.driverId,
        driverRefId: data.driverId,
        tripStatus: "confirmed",
        createdAt: new Date(),
        updatedAt: new Date()
    }

    groupdriverTable.findOneAndUpdate(query, update, { upsert: true, "new": true }, callback);
}

module.exports.updateInrouteDriver = (data,callback) => {
    var query = { _id: data.groupId };

    var update = {
        tripStatus: "inroute",
        driverInrouteAt: new Date()
    }

    groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.driverArrived = (id, callback) => {
    var query = { _id: id };
    var update = {
        driverArrivedStatus: "yes",
        driverArrivedAt : new Date()
    }
    groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.driverWaitedCancel = (id, callback) => {
    var query = { _id: id };
    var update = {
        driverWaitedUpto: new Date(),
        tripStatus: "cancel"
    }

    return groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.customerCancel = (id, callback) => {
    var query = { _id: id };
    var update = {
        canceled: new Date(),
        tripStatus: "cancel"
    }

    return groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.tripStarted = (id, callback) => {
    var query = { _id: id };
    var update = {
        tripStartedAt: new Date(),
        tripStatus: "started"
    }

    groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.tripEnd = (data, callback) => {
    var query = { _id: data.groupId };
    var update = {
        tripEndedAt: new Date(),
        tripStatus: "completed",
        cost: data.cost,
        driverEarning: data.driverEarning
    }

    groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.getDriverGroupTrips = (data, callback) => {
    return groupdriverTable.find({ driverId: data.driverId, tripStatus: { $in: ["confirmed", "inroute", "started"] } }, callback);
}

module.exports.getDriverGroupPastTrips = (data, callback) => {
    return groupdriverTable.find({ driverId: data.driverId, tripStatus: { $in: ["completed", "cancel"] } }, callback);
}

module.exports.getCustomerGroupTrips = (data, callback) => {
    return groupdriverTable.find({ customerId: data.customerId, tripStatus: { $in: ["completed", "cancel"] } }, callback);
}

module.exports.getCustomerGroupTripsStatus = (data, callback) => {
    return groupdriverTable.find({ customerId: data.customerId, tripStatus: { $in: ["confirmed", "inroute", "started"] } }, callback);
}

module.exports.feedbackByCustomer = (id, data, callback) => {
    var query = { _id: id };
    var update = {
        "review.driverRating": data.driverRating,
        //"review.driverReview":              data.driverReview,
        "review.CSubAt": new Date(),
        tipAmount: data.tipAmount
    }

    return groupdriverTable.findOneAndUpdate(query, update, { "new": true }, callback);
}