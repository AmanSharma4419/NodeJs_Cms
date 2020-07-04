var mongoose = require('mongoose');
var driverSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, require: true },
    mobileNumber: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Others'], required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "null" },
    address: { type: String },
    dl: { type: String, required: true },
    accountDetails: { type: Object, default: null },
    licenceNumber: { type: String },
    licenceExpDate: { type: String },
    languageId: { type: String },
    languageDetails: { type: Object, default: null },
    OTP: { type: String },
    OTPexp: { type: Date, default: null },
    token: { type: String },
    restToken: { type: String, default: null },
    CompletedTripsInfo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trips' }],
    requestTrips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trips' }],
    cars: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cars' }],
    selectedCar: { type: mongoose.Schema.Types.ObjectId, ref: 'Cars', default: null },
    selectedCarTypeId: { type: String, default: null },
    avgRating: { type: Number, default: 0 },
    tripsCompleted: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date, default: null },
    isBlocked: { type: Boolean, default: false },
    status: { type: String, enum: ['created', 'approved', 'rejected'], default: "created" },
    driverLocation: {
        type: { type: String, enum: ['Point'], default: "Point" },
        coordinates: { type: [Number] }
    },
    driverStatus: { type: String, default: constant.DRIVER_OFFLINE },
    documentsList: [
        {
            type: { type: String },
            number: { type: String },
            date: { type: String },
            image: { type: String }
        }
    ],
    overallPendingBalance: { type: Number, required: false, default: 0 },
    overallCashBalance: { type: Number, required: false, default: 0 },
    countryCode: { type: String, default: null },
    currentTripId: { type: String, default: null },
    firebaseToken: { type: String, default: null },
    isRequestSend: { type: String, enum: ["yes", "no"], default: "no" },
    isEndOfDayTrip: {type: String, enum: ["yes", "no"], default:"no"},
    socketId: { type: String },
    socketConnectedAt: { type: Date },
    socketStatus: { type: String, enum: ["yes", "no"], default: "no" },
    tripRequestTime: { type: Date },
    isTripAccepted: { type: String, enum: ["yes", "no"], default: "no" },
    isNoMoreAcceptPoolTrip : {type: String, enum: ["yes", "no"], default: "no" }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

driverSchema.index({ driverLocation: "2dsphere" }, { background: true });

const drivers = module.exports = mongoose.model('driver', driverSchema);

//get all drivers
module.exports.getDrivers = function(pageSize,sortByField,sortOrder,paged,obj,callback) {
    drivers.aggregate([
        {$match:obj},
        {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
        {$limit: parseInt(pageSize)},
    ],callback);
}

module.exports.getDriversList = function(callback) {
    drivers.find({},callback);
}

// for call backs
module.exports.findDriverr = function (data, callback) {
    drivers.find({ email: data }, callback).limit(1);
}
// for async await 
module.exports.findDriver = function (data) {
    return drivers.find({ email: data, status: "approved" }).limit(1);
}
module.exports.findDriverByIdAsync = function (id) {
    return drivers.findById(id);
}
module.exports.addDriver = (data, callback) => {
    var query = { email: data.email };
    data.isRequestSend = "no";
    data.createdAt = new Date();
    drivers.findOneAndUpdate(query, data, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.editDriver = (data, callback) => {
    var query = { _id: data.driverId };
    data.updatedAt = new Date();
    drivers.findOneAndUpdate(query, data, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.addDriverSocket = function (data, callback) {
    var query = { _id: data.driverId };
    var datad = {
        driverLocation: data.driverLocation,
        socketId: data.socketId,
        socketConnectedAt: new Date(),
        socketStatus: "no"
    }
    drivers.findOneAndUpdate(query, datad, { upsert: true, fields: { driverLocation: 1, isTripAccepted: 1, tripRequestTime: 1, currentTripId: 1, socketId: 1, socketStatus: 1, driverStatus: 1 }, new: true }, callback);
}

module.exports.removeSocketDriver = function (data, callback) {
    var query = { socketId: data };
    var datad = {
        offline: "yes"
    }
    drivers.findOneAndUpdate(query, datad, { new: true }, callback);
}

module.exports.updateDriverStatusOnTrip = (driverId, callback) => {
    var query = { _id: driverId };
    var update = {
        driverStatus: constant.TRIP_ON_TRIP,
    }
    drivers.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1 }, "new": true }, callback);
}

module.exports.updateDriverStatusOnTripRidehailing = (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        driverStatus: constant.TRIP_ON_TRIP,
        currentTripId: data.currentTripId
    }
    drivers.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1 }, "new": true }, callback);
}

module.exports.updateDriverStatusOnPickupInrouteTrip = (driverId, callback) => {
    var query = { _id: driverId };
    var update = {
        driverStatus: constant.TRIP_PICKUP_INROUTE,
    }
    drivers.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1 }, "new": true }, callback);
}

module.exports.updateDriverStatusOnPoolTrip = (driverId, callback) => {
    var query = { _id: driverId };
    var update = {
        driverStatus: constant.DRIVER_POOL_TRIPS,
        isNoMoreAcceptPoolTrip : "no"
    }
    drivers.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1 }, "new": true }, callback);
}

//get driver by id need for admin 
module.exports.getDriverById = (id, callback) => {
    drivers.findById(id)
        .populate({
            path: "selectedCar",
            populate: {
                path: "carTypeId",
                select: { basePrice: 1, pricePerUnitDistance: 1, pricePerUnitTimeMinute: 1 }
            }
        }).exec(callback);
}

module.exports.getDriversByIds = (ids, callback) => {
    drivers.find({ _id: { $in: ids } }, 'driverStatus driverLocation firebaseToken socketId socketStatus isEndOfDayTrip', callback);
}

module.exports.getDriversByIdsPool = (ids, callback) => {
    drivers.find({ _id: { $in: ids } }, 'profileImage mobileNumber email name avgRating tripsCompleted overallPendingBalance overallCashBalance selectedCar driverStatus driverLocation firebaseToken socketId socketStatus', callback);
}

// Updating driver // will make another api for admin later
module.exports.updateDriver = (id, data, options, callback) => {
    var query = { _id: id };
    var update = {
        name: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber,
        gender: data.gender,
        password: data.password,
        address: data.address,
        city: data.city,
        dl: data.dl,
        licenceNumber: data.licenceNumber,
        licenceExpDate: data.licenceExpDate,
        cars: data.cars,
        status: 'created',
        createdAt: new Date()
    }
    update.updatedAt = new Date(); // change it later
    return drivers.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}

// remove driver
module.exports.removeDriver = (id, callback) => {
    var query = { _id: id };
    drivers.remove(query, callback);
}

//////////////////// basic CRUD operations Ends for DB ////////////////////////////

// update OTP for driver
module.exports.updateOTPDriver = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: data.OTP,
        OTPexp: data.OTPexp
    }
    drivers.findOneAndUpdate(query, update, { fields: { name: 0, mobileNumber: 0, gender: 0, password: 0, profileImage: 0, city: 0, dl: 0, token: 0, restToken: 0, CompletedTripsInfo: 0, avgRating: 0, tripsCompleted: 0, createdAt: 0, UpdatedAt: 0, status: 0, }, "new": true }, callback);
}

module.exports.updateOTPDriverAsync = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: data.OTP,
        OTPexp: data.OTPexp
    }
    return drivers.findOneAndUpdate(query, update, { fields: { name: 0, mobileNumber: 0, gender: 0, password: 0, profileImage: 0, city: 0, dl: 0, token: 0, restToken: 0, CompletedTripsInfo: 0, avgRating: 0, tripsCompleted: 0, createdAt: 0, UpdatedAt: 0, status: 0, }, "new": true }, callback);
}

// update Password for driver
module.exports.updatePasswordDriver = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: "",
        OTPexp: "",
        token: data.token,
        password: data.password
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

// update token for driver
module.exports.updateTokenDriver = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        token: data.token,
        firebaseToken:data.firebaseToken
    }

    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true })
        .populate({
            path: "selectedCar",
            populate: {
                path: "carTypeId",
                select: { basePrice: 1, pricePerUnitDistance: 1, pricePerUnitTimeMinute: 1 }
            }
        }).exec(callback);
}

module.exports.findingTripsOn =  (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        driverStatus: constant.DRIVER_FINDING_TRIPS,
        overallPendingBalance: data.overallPendingBalance,
        overallCashBalance: data.overallCashBalance,
        tripsCompleted: data.tripsCompleted
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.findingTripsOnByCustomer = async (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        driverStatus: constant.DRIVER_FINDING_TRIPS
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.updateDriverAvgRating = async (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        avgRating: data.avgRating
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.findingTripsOnind = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        driverStatus: constant.DRIVER_FINDING_TRIPS
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.statusOnlineOffline = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        driverStatus: data.driverStatus,
        isRequestSend: "no",
        isEndOfDayTrip:"no"
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.updateEndOfDayTrip = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        isEndOfDayTrip: data.isEndOfDay  
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.onTrip = async (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        driverStatus: constant.TRIP_ON_TRIP,
        currentTripId: data.currentTripId
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.driverOffline = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        driverStatus: constant.DRIVER_OFFLINE
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.logout = (data, callback) => {
    var query = { email: data.email };
    var update = {
        token: null,
        driverStatus: constant.DRIVER_OFFLINE,
    }
    drivers.findOneAndUpdate(query, update, callback);
}

module.exports.updateOverall = async (data, callback) => {
    var query = { _id: data.did };
    var update = {
        overallPendingBalance: data.overallPendingBalance,
        overallCashBalance: data.overallCashBalance
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

// update profileimage for driver
module.exports.updateProfileImageDriver = async (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        profileImage: data.profileImage
    }
    return drivers.findOneAndUpdate(query, update, { new: true })
        .populate({
            path: "selectedCar",
            populate: {
                path: "carTypeId",
                select: { basePrice: 1, pricePerUnitDistance: 1, pricePerUnitTimeMinute: 1 }
            }
        }).exec(callback);
}

// authentication  will have to remove later
module.exports.verifyDriver = (data) => {
    var where = {
        email: data.email,

    } // token:data.token add token later 
    return drivers.findOne(where, { password: 0 });
}

//update driver profile
module.exports.updateDriverProfile = (data, callback) => {
    var query = { _id: data._id };
    var update = {
        name: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber,
        address: data.address
    }
    update.updatedAt = new Date(); // change it later
    return drivers.findOneAndUpdate(query, update, { fields: { password: 0, dl: 0, cars: 0, CompletedTripsInfo: 0, }, "new": true })
        .populate({
            path: "selectedCar",
            populate: {
                path: "carTypeId",
                select: { basePrice: 1, pricePerUnitDistance: 1, pricePerUnitTimeMinute: 1 }
            }
        }).exec(callback);
}

// for admin to activate driver
module.exports.updateDriverStatus = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        status: data.status
    }
    update.updatedAt = new Date(); // change it later
    drivers.findOneAndUpdate(query, update, { "fields": { name: 0, mobileNumber: 0, gender: 0, password: 0, profileImage: 0, city: 0, dl: 0, OTP: 0, OTPexp: 0, token: 0, restToken: 0, CompletedTripsInfo: 0, avgRating: 0, tripsCompleted: 0, createdAt: 0, UpdatedAt: 0 }, "new": true }, callback);
}

module.exports.updateDriverStatusd = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        driverStatus: constant.DRIVER_FINDING_TRIPS
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0 }, "new": true }, callback);
}

// adding cars to driver list
module.exports.AddRefToCars = (data) => {
    var query = { _id: data.driverId };
    var ref = data.ref;
    return drivers.findOneAndUpdate(query, {
        $push: {
            cars: ref
        }
    }, { upsert: true, new: true });
}

// remove cars from drivers list
module.exports.removeRefToCars = (data) => {
    var query = { _id: data.driverId };
    var ref = data.ref;
    return drivers.findOneAndUpdate(query, {
        $pull: {
            cars: ref
        }
    }, { upsert: true, new: true });
}

// updating selected car at time
module.exports.updateSelectedCars = (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        selectedCar: data.carId,
        selectedCarTypeId: data.carTypeId
    }

    return drivers.findOneAndUpdate(query, update, { new: true })
        .populate({
            path: "selectedCar",
            populate: {
                path: "carTypeId",
                select: { basePrice: 1, pricePerUnitDistance: 1, pricePerUnitTimeMinute: 1 }
            }
        }).exec(callback);
}

// get list of cars for driver
module.exports.getDriverWithPOPCars = (data, callback) => {
    drivers
        .find({ email: data.email }, 'email cars')
        .populate({
            path: 'cars',
        }).select()
        .exec(callback);
}

/////////////////trips part/////////////////////

module.exports.AddRefToTrip = (data, callback) => {
    var query = { email: data.email };
    var ref = data.ref;
    //console.log(query);
    drivers.findOneAndUpdate(query, {
        $push: {
            CompletedTripsInfo: ref
        }
    }, { new: true }, function (err, data) {
        if (err) {
            //console.log(err)
        }
    });
}

module.exports.AddRefToTripRequest = (data, callback) => {
    var query = { email: data.email };
    var ref = data.ref;
    //console.log(query);
    drivers.findOneAndUpdate(query, {
        $push: {
            requestTrips: ref
        }
    }, { new: true }, function (err, data) {
        if (err) {
            //console.log(err)
        }
    });
}

module.exports.getDriverWithPOPTripsRequest = (data, callback) => {
    //console.log(data);
    drivers
        .find({ _id: data.driverId }, 'requestTrips')
        .populate({
            path: 'requestTrips',
            //select: {promoCodeCost:0,customerRefId:0,driverRefId:0,percentCharge: 0,customerId:0,driverWaitedUpto:0,promoCode:0 ,paymentSourceRefNo:0,paymentRefNo:0,paymentMethod:0,driverWaitedUpto:0, scheduledAt:0, canceled:0},
            options: { sort: { tripCreatedAt: -1 }, limit: 1 },
            match: { tripStatus: 'searching' }
        })
        .exec(callback);
}

module.exports.getDriverWithPOPTrips = (data, callback) => {
    //console.log(data);
    drivers
        .find({ _id: data._id }, 'CompletedTripsInfo')
        .populate({
            path: 'CompletedTripsInfo',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripEndedAt: -1 }, limit: 20 },
            match: { tripStatus: 'completed' }
        })
        .exec(callback);
}

module.exports.getDriverWithPOPTripsOT = (data, callback) => {
    //console.log(data);
    drivers
        .find({ _id: data._id }, 'CompletedTripsInfo')
        .populate({
            path: 'CompletedTripsInfo',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripConfirmedAt: -1 }, limit: 1 }
        })
        .exec(callback);
}
// update DL
module.exports.updateDocument = (data, callback) => {
    var query = { _id: data.driverId, "documentsList._id": data.docId };
    drivers.findOneAndUpdate(query, { $set: { "documentsList.$.number": data.number, "documentsList.$.date": data.date, "documentsList.$.image": data.image } }, { "new": true }, callback);
}

module.exports.addDocument = (data, callback) => {
    var query = { _id: data.driverId };

    var pushData = {
        type: data.type,
        number: data.number,
        date: data.date,
        image: data.image
    }

    var update = {
        $addToSet: {
            "documentsList": pushData
        }
    }

    drivers.findOneAndUpdate(query, update, { upsert: true, "new": true }, callback);
}

module.exports.updateAccountDetails = (data, callback) => {
    var query = { _id: data._id };
    var update = {
        accountDetails: {
            accountNumber: data.accountNumber,
            routingNumber: data.routingNumber,
            name: data.name,
            bankName: data.bankName
        }
    }
    drivers.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.findDocument = function (data, callback) {
    drivers.findById(data, 'dl licenceNumber licenceExpDate', callback);
}
// location

module.exports.updateLocation = async (data, callback) => {
    var query = { _id: data.driverId };
    var update = {
        driverLocation: data.driverLocation
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}

module.exports.driverAuth = (data) => {
    return drivers.findOne({ _id: data.driverid, token: data.token }).populate("selectedCar");
}

module.exports.getNearByDrivers = (data) => {

    return drivers.aggregate(
        [
            {
                "$geoNear": {
                    "near": data.startPoint,
                    "distanceField": "distance",
                    key: "driverLocation",
                    "spherical": true,
                    "maxDistance": data.radius,
                    query: data.query,
                }
            },
            { $limit: 10 }
        ]);
}

module.exports.getNearByPoolDrivers = (data) => {

    return drivers.aggregate(
        [
            {
                "$geoNear": {
                    "near": data.startPoint,
                    "distanceField": "distance",
                    key: "driverLocation",
                    "spherical": true,
                    "maxDistance": data.radius,
                    query: data.query,
                }
            },
            { $limit: 1 }
        ]);
}

module.exports.updateNoMorePoolTripStatus = (driverId, callback) => {
    var query = { _id: driverId };
    var update = {
        isNoMoreAcceptPoolTrip: "yes"
    }
    drivers.findOneAndUpdate(query, update, { fields: { password: 0, CompletedTripsInfo: 0, dl: 0, cars: 0, }, "new": true }, callback);
}