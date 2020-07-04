var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String },
    password: { type: String, default: "none" },
    address: { type: String },
    profileImage: { type: String, default: "none" },
    userType: { type: String, enum: ["registered", "nonregistered"], default: "registered" },
    OTP: { type: String },
    OTPexp: { type: Date },
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trips' }],
    prefferedDriver: [{ type: mongoose.Schema.Types.ObjectId, ref: 'driver' }],
    token: { type: String },
    //languageId: { type: String },
    //languageDetails: { type: Object, default: null },
    restToken: { type: String },
    createdAt: { type: Date },
    UpdatedAt: { type: Date },
    isBlocked: { type: Boolean, default: false },
    customerAvgRating: { type: Number, default: 0 },
    customerStatus: { type: String, default: constant.TRIP_FINDING },
    role: { type: String, enum: ["USER", "ADMIN", "SUPPERADMIN", "SUBADMIN"], default: 'USER' },
    countryCode: { type: String },
    walletCredit: { type: Number, default: 0 },
    timezone: { type: String, default: null },
    fbid: { type: String, default: null }, //facebook id
    gid: { type: String, default: null }, //google id
    appleid: { type: String, default: null },
    floor:{type:String, default:null},
    roomNumber:{type:String, default:null},
    userPendingBalance: { type: Number, default: 0 },
    currentTripId: { type: String, default: null },
    firebaseToken: { type: String, default: null },
    socketId: { type: String },
    socketConnectedAt: { type: Date },
    socketStatus: { type: String, enum: ["yes", "no"], default: "yes" },
    tripRequestTime: { type: Date, default: null }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

//userSchema.index({ userLocation:"2dsphere" })

const User = module.exports = mongoose.model('User', userSchema);

//get all users
module.exports.getUsers = function (callback, limit) {
    User.find(callback).limit(limit);
}

//add admin
module.exports.addAdmin = function (data, callback) {

    var query = { email: data.email };
    var update = {
        name: data.name,
        email: data.email,
        password: data.password,
        token: data.token,
        role: data.role,
        createdAt: new Date()
    }

    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.adminLogin = function (data, callback) {
    var query = { email: data.email, password: data.password };
    User.find(query, callback);
}

module.exports.updateAdminToken = function (email, token, callback) {
    var query = { email: email };
    var update = {
        token: token
    }
    //console.log("Query", query);
    //console.log("Update", update);
    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.getUsersWithFilter = function (obj,sortByField,sortOrder,paged,pageSize, callback) {
    User.aggregate([{$match:obj},
        {$match:{role:{$ne :"ADMIN"}}},
        {$sort :{[sortByField]:  parseInt(sortOrder)}},
        {$skip: (paged-1)*pageSize},
        {$limit: parseInt(pageSize) },
      ],callback);
}

//add user 
module.exports.addUser = function (data, callback) {
    console.log("Inside update");
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        name: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber,
        password: data.password,
        address: data.address,
        //languageId: data.languageId,
        //languageDetails: data.languageDetails,
        profileImage: data.profileImage,
        city: data.city,
        countryCode: data.countryCode,
        fbid: data.fbid,
        gid: data.gid,
        appleid: data.appleid,
        token: data.token,
        createdAt: new Date(),
        role: "USER"
    }
    User.findOneAndUpdate(query, update, { upsert: true, fields: { password: 0 }, new: true }, callback)
}

module.exports.addCustomerSocket = (data, callback) => {
    var query = { _id: data.customerId };
    var datad = {
        socketId: data.socketId,
        socketConnectedAt: new Date(),
        socketStatus: "no"
    }
    User.findOneAndUpdate(query, datad, { upsert: true, fields: { tripRequestTime: 1, currentTripId: 1, socketId: 1, socketStatus: 1, customerStatus: 1 }, new: true }, callback);
}

module.exports.removeSocketCustomer = (data, callback) => {
    var query = { socketId: data };
    var datad = {
        offline: "yes"
    }
    User.findOneAndUpdate(query, datad, { new: true }, callback);
}

module.exports.findCSocket = (currentTripId, callback) => {
    var query = { currentTripId: currentTripId };
    User.findOne(query, 'customerStatus currentTripId socketId socketStatus', callback);
}

module.exports.findCSocketAsync = (currentTripId, callback) => {
    var query = { currentTripId: currentTripId };
    return User.findOne(query, 'customerStatus currentTripId socketId socketStatus', callback);
}

module.exports.getCustomerFirebaseToken = (customerId, callback) => {
    var query = { _id: customerId };
    User.findOne(query, 'firebaseToken socketId socketStatus', callback);
}

module.exports.getUserWalletAmount = (customerId, callback) => {
    var query = { _id: customerId };
    return User.findOne(query, 'walletCredit', callback);
}

module.exports.addHotelCustomer = function (data, callback) {
    data.createdAt = new Date();
    data.updatedAt = new Date();
    return User.create(data, callback);
}

module.exports.addDispatcherCustomer = function (data, callback) {
    data.createdAt = new Date();
    data.updatedAt = new Date();
    return User.create(data, callback);
}

//edit user profile
module.exports.getUserById = (id, callback) => {
    User.findById(id, callback);
}
module.exports.getUserByIdAsync = (id, callback) => {
    return User.findById(id, callback);
}

//get user by email
module.exports.getUserByEmail = (data, callback) => {
    var query = { email: data.email };
    return User.findOne(query, callback);
}

// Updating user
module.exports.updateUser = (id, data, options, callback) => {
    var query = { _id: id };
    var update = {
        firstName: data.firstName,
        lastName: data.lastName,
        profileImage: data.profileImage,
    }
    update.updatedAt = new Date(); // change it later
    return User.findOneAndUpdate(query, update, { fields: { password: 0 } }, callback);
}

module.exports.updateUserWalletCredit = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        walletCredit: data.walletCredit,
        updatedAt: new Date()
    }
    return User.findOneAndUpdate(query, update, { fields: { password: 0, trips: 0 } }, callback);
}

module.exports.upFBTandLocation = (data, options, callback) => {
    var query = { _id: data._id };
    var update = {
        fireBaseToken: data.fireBaseToken,
        userLocation: data.userLocation,
    }
    update.updatedAt = new Date(); // change it later
    return User.findOneAndUpdate(query, update, { fields: { password: 0 }, upsert: true, new: true }, callback);
}


module.exports.updateUserProfile = (data, options, callback) => {
    var query = { _id: data._id };
    var update = {
        name: data.name,
        address: data.address,
        city: data.city,
        email: data.email,
        mobileNumber: data.mobileNumber,
        updatedAt: new Date()
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0, trips: 0 }, "new": true }, callback);
}

//update profile image
module.exports.updateProfileImage = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        profileImage: data.profileImage,
        updatedAt: new Date()
    }
    User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.updateOTP = (data, callback) => {
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        token: data.token,
        OTP: data.OTP,
        OTPexp: data.OTPexp
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.removeUser = (id, callback) => {
    var query = { _id: id };
    User.remove(query, callback);
}

module.exports.updatePassword = (data, options, callback) => {
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        password: data.password,
        updatedAt: new Date()
    }
    return User.findOneAndUpdate(query, update, options, callback);
}

module.exports.addToUserWallet = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        walletCredit: data.walletCredit,
        updatedAt: new Date()
    }
    User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.updateToken = (data, callback) => {
    var query = { mobileNumber: data.mobileNumber };
    var update = {
        token: data.token,
        firebaseToken: data.firebaseToken
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.custAuth = (data) => {
    return User.findOne({ _id: data.customerid, token: data.token });
}

module.exports.adminAuth = (data) => {
    return User.findOne({ _id: data.adminid, token: data.token, role: { $in: ["ADMIN", "SUPERADMIN"] } });
}

module.exports.customerAuthFb = (data) => {
    return User.findOne({ fbid: data.fbid });
}

module.exports.customerAuthGid = (data) => {
    return User.findOne({ gid: data.gid });
}

//get firbase token
module.exports.getCustomerFBT = (data, callback) => {
    return User.findOne({ _id: data.customerId }, "fireBaseToken name", callback);
}

module.exports.getCustomerDetails = (data, callback) => {
    return User.findOne({ _id: data.customerId }, { password: 0, token: 0, fireBaseToken: 0 }, callback);
}

module.exports.updateCustomerAvgRating = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerAvgRating: data.customerAvgRating
    }
    User.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}

//go online
module.exports.goOnline = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerStatus: constant.TRIP_FINDING,
        updatedAt: new Date()
    }
    User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

//go offline
module.exports.goOffline = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerStatus: "Offline",
        updatedAt: new Date()
    }
    User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

// create Trips
module.exports.AddRefToTrip = (data, callback) => {
    var query = { _id: data.customerId };
    var ref = data.ref;
    User.findOneAndUpdate(query, {
        $push: {
            trips: ref
        },
        currentTripId: data.ref,
        tripRequestTime: new Date()
    }, { new: true }, function (err, data) {
        if (err) {
            //console.log(err)
        }
    });
}

module.exports.findCSocketCallback = (customerId,callback) => {
    User.findOne({_id:customerId}, 'firebaseToken socketId socketStatus', callback);
}

module.exports.findingTrip = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerStatus: constant.TRIP_FINDING,
        userPendingBalance: data.userPendingBalance
    }
    User.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1, socketStatus: 1, socketId: 1 }, "new": true }, callback);
}

module.exports.updateCustomerStatusd = (data, callback) => {
    var query = { mobileNumber: data.customerNumber };
    var update = {
        customerStatus: constant.TRIP_FINDING
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0, trips: 0 }, "new": true }, callback);
}

module.exports.onTrip = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerStatus: constant.TRIP_ON_TRIP
    }
    return User.findOneAndUpdate(query, update, { "fields": { password: 0, trips: 0,firebaseToken: 1, socketStatus: 1, socketId: 1 }, "new": true }, callback);
}

module.exports.waitingForCab = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        customerStatus: constant.TRIP_WAITING_DRIVER,
    }
    User.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1, socketStatus: 1, socketId: 1 }, "new": true }, callback);
}

module.exports.updateCustomerStatusOnTrip = (customerId, callback) => {
    var query = { _id: customerId };
    var update = {
        customerStatus: constant.TRIP_ON_TRIP,
    }
    User.findOneAndUpdate(query, update, { "fields": { firebaseToken: 1, socketStatus: 1, socketId: 1 }, "new": true }, callback);
}

module.exports.getUserWithPOPTrips = (data, callback) => {
    User
        .find({ _id: data._id }, 'trips')
        .populate({
            path: 'trips',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripEndedAt: -1 } },
            match: { tripStatus: 'completed' }
        })
        .exec(callback);
}

module.exports.getUserWithPOPTripsUpcoming = (data, callback) => {
    User
        .find({ mobileNumber: data.mobileNumber }, 'trips')
        .populate({
            path: 'trips',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, canceled: 0 },
            options: { sort: { tripCreatedAt: -1 } },
            match: { tripStatus: 'schedule', scheduleCompare: { $gt: new Date() } }
        })
        .exec(callback);
}

module.exports.getUserWithPOPTripsWFD = (data, callback) => {
    User
        .find({ _id: data._id }, 'trips')
        .populate({
            path: 'trips',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripConfirmedAt: -1 }, limit: 1 },
            match: { tripStatus: 'confirmed' }
        })
        .exec(callback);
}

module.exports.getUserWithPOPTripsOT = (data, callback) => {
    User
        .find({ _id: data._id }, 'trips')
        .populate({
            path: 'trips',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, driverWaitedUpto: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripStartedAt: -1 }, limit: 1 },
            match: { tripStatus: 'started' }
        })
        .exec(callback);
}

module.exports.forcheckingPending = (data, callback) => {
    User
        .find({ _id: data._id }, 'trips')
        .populate({
            path: 'trips',
            select: { promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripConfirmedAt: -1 }, limit: 1 },
            match: { tripStatus: { $in: ['cancel', 'completed'] } }
        })
        .exec(callback);
}

module.exports.forcheckingPendingd = (data, callback) => {
    User
        .find({ _id: data.customerId }, 'trips')
        .populate({
            path: 'trips',
            select: { description: 0, promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripConfirmedAt: -1 }, limit: 1 },
            match: { tripStatus: { $in: ['cancel', 'completed'] } }
        })
        .exec(callback);
}

module.exports.forcheckingPendingdd = (data) => {
    return User
        .find({ _id: data.customerId }, 'trips')
        .populate({
            path: 'trips',
            select: { description: 0, promoCodeCost: 0, customerRefId: 0, driverRefId: 0, percentCharge: 0, customerId: 0, driverWaitedUpto: 0, promoCode: 0, paymentSourceRefNo: 0, paymentRefNo: 0, paymentMethod: 0, scheduledAt: 0, canceled: 0 },
            options: { sort: { tripConfirmedAt: -1 }, limit: 1 },
            match: { tripStatus: { $in: ['cancel', 'completed'] } }
        })
        .exec();
}

module.exports.AddRefToPrefferedDriver = (data, callback) => {
    var ref = data.driverId;
    var query = { _id: data.customerId };
    User.findOneAndUpdate(query, { $addToSet: { prefferedDriver: ref } }, { new: true }, callback);
}

module.exports.removeRefToPrefferedDriver = (data, callback) => {
    var query = { _id: data.customerId };
    var ref = data.driverId;
    User.findOneAndUpdate(query, {
        $pull: {
            prefferedDriver: ref
        }
    }, { new: true }, callback);
}

module.exports.getListOFPrefferedDrivers = (data, callback) => {
    User
        .find({ _id: data.customerId }, 'driver')
        .populate({
            path: 'prefferedDriver',
            populate: {
                path: 'selectedCar',
                model: 'Cars'
            }, 
            select: { password: 0, updatedAt: 0, CompletedTripsInfo: 0, token: 0, licenceExpDate: 0, dl: 0, OTPexp: 0, restToken: 0, address: 0, licenceExpDate: 0, status: 0 },
            options: {},
            match: { status: "approved" }
        })
        .exec(callback);
}

module.exports.validatePrefferedDrivers = (data) => {
    return User
        .find({ _id: data.customerId }, 'driver')
        .populate({
            path: 'prefferedDriver',
            select: { password: 0, updatedAt: 0, CompletedTripsInfo: 0, token: 0, licenceExpDate: 0, dl: 0, selectedCar: 0, OTPexp: 0, restToken: 0, address: 0, licenceExpDate: 0, status: 0 },
            options: {},
            match: { _id: data.driverId }
        })
        .exec();
}

module.exports.addUserPending = (data, callback) => {
    var query = { _id: data.customerId };
    var update = {
        userPendingBalance: data.userPendingBalance
    }
    User.findOneAndUpdate(query, update, { "fields": { password: 0 }, "new": true }, callback);
}

module.exports.checkOldPassword = (password,userid,callback) => {
    //console.log("data", password);
    //console.log("userid", userid);
    User.find({
        _id:userid,
        password:password
    },callback);
}

module.exports.changePassword = (password,userid,callback) => {
    var query = { _id: userid };
    const update = {
        password:password
    }
    User.findOneAndUpdate(query, update, {new: true},callback)
}