var mongoose = require('mongoose');

var carTypeSchema = mongoose.Schema({
    carType: { type: String },
    carImage: { type: String, default: null },
    maxPersons: { type: Number },
    minimumFare: { type: Number },
    distanceForBaseFare: { type: Number },
    basePrice: { type: Number },
    pricePerUnitDistance: { type: Number },
    pricePerUnitTimeMinute: { type: Number },
    driverPercentCharge: { type: Number },
    waitingTimeStartAfterMin: { type: Number },
    waitingTimePrice: { type: Number },
    cancellationTimeMin: { type: Number },
    cancellationFee: { type: Number },
    taxStatus: { type: String, enum: ["yes", "no"], default: "yes" },
    taxPercentageCharge: { type: Number },
    unit: { type: String, enum: ["km", "mile"], default: "km", lowercase: true },
    isSurgeTime: { type: String, enum: ["yes", "no"], default: "no" },
    status: { type: String, enum: ["yes", "no"], default: "yes" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const cartypesch = module.exports = mongoose.model('Cartype', carTypeSchema);

module.exports.getCarsTypesall = (callback) => {
    cartypesch.find({}, callback).sort({ createdAt: -1 });
}
module.exports.getCarsTypes = (data) => {
    return cartypesch.find({ carType: data.carType });
}

module.exports.getEnabledCarsTypes = (callback) => {
    cartypesch.find({ status: "yes" }, callback);
}

module.exports.getEnabledCarsTypesByCarTypeId = (carTypeId, callback) => {
    cartypesch.findOne({ _id: carTypeId }, callback);
}

module.exports.getTruckListAsync = (callback) => {
    return cartypesch.find({}, callback);
}

module.exports.getCarsTypeCity = (data) => {
    return cartypesch.findOne({ carType: data.carType });
}

module.exports.getCarsTypesByIdAsync = (id, callback) => {
    return cartypesch.findById({ _id: id }, callback);
}

module.exports.getCarsTypesById = (id, callback) => {
    cartypesch.findById({ _id: id }, callback);
}

module.exports.getCarsBycarType = (carType, callback) => {
    cartypesch.findOne({ carType: carType }, callback);
}

module.exports.addCarType = function (data, callback) {
    var query = { carType: data.carType };
    cartypesch.findOneAndUpdate(query, data, { upsert: true, new: true }, callback);
}

module.exports.updateCarType = (id, data, callback) => {
    var query = { _id: id };
    cartypesch.findOneAndUpdate(query, data, { new: true }, callback);
}

module.exports.removeCartype = function (id, callback) {
    var query = { _id: id };
    cartypesch.remove(query, callback)
}
