var mongoose = require('mongoose');
var DriverSocketSchema = mongoose.Schema({
    socketId: { type: String },
    driverId: { type: String },
    firebase_token: { type: String, default: null },
    connectedAt: { type: Date },
    offline: { type: String, enum: ["yes", "no"], default: "no" }
})


const DCsch = module.exports = mongoose.model('SocketDriver', DriverSocketSchema);

module.exports.findDSocket = (data) => {
    return DCsch.findOne({ email: data });
}

module.exports.findDSocketById = (data) => {
    return DCsch.findOne({ driverId: data });
}

module.exports.findDSocketByIdCallback = (data, callback) => {
    DCsch.findOne({ driverId: data }, callback);
}

module.exports.findDSocketS = (data) => {
    return DCsch.findOne({ email: data, offline: false });
}

module.exports.findDSocketSWithoutOffline = (data) => {
    return DCsch.findOne({ email: data });
}

module.exports.findDSocketId = (data, callback) => {
    return DCsch.findOne({ socketId: data }, callback);
}

module.exports.addDriverSocket = function (data, callback) {
    var query = { driverId: data.driverId };
    var datad = {
        socketId: data.socketId,
        driverId: data.driverId,
        firebase_token: data.firebase_token,
        connectedAt: new Date(),
        offline: "no"
    }
    DCsch.findOneAndUpdate(query, datad, { upsert: true, new: true }, callback);
}

module.exports.addDriverSocketInLocation = function (data, callback) {
    var query = { driverId: data.driverId };
    var datad = {
        socketId: data.socketId,
        driverId: data.driverId,
        connectedAt: new Date(),
        offline: "no"
    }
    DCsch.findOneAndUpdate(query, datad, { new: true }, callback);
}

module.exports.removeDriver = function (data, callback) {
    var query = { socketId: data };
    var datad = {
        offline: "yes"
    }
    DCsch.findOneAndUpdate(query, datad, { new: true }, callback);
}