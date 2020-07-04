
var mongoose = require('mongoose');

var carsSchema = mongoose.Schema({
    driverId: { type: String },
    carName: { type: String },
    carColor: { type: String },
    carImage: { type: String },
    carImage2:{ type: String},
    carImage3:{ type: String},
    carImage4:{ type: String},
    plateNumber: { type: String },
    carType: { type: String },
    carTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cartype' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const carssch = module.exports = mongoose.model('Cars', carsSchema);

module.exports.getCars = (callback) => {
    carssch.find({}, callback);
}

module.exports.getCarsByDriver = (data, callback) => {
    carssch.find({ email: data.email }, callback);
}

module.exports.getCarsByDriverList = (id, callback) => {
    carssch.find({ driverId: id }, callback);
}

module.exports.getCarsByDriverListAsync = (data, callback) => {
    return carssch.find({ driverId: data.driverId }, callback);
}

module.exports.getCarsById = (id, callback) => {
    carssch.findById({ _id: id }, callback);
}

module.exports.getCarsByIdAsync = (id, callback) => {
    return carssch.findById({ _id: id }, callback);
}

module.exports.addCars = function (data, callback) {
    var datad = {
        driverId: data.driverId,
        carName: data.carName,
        carColor: data.carColor,
        carImage: data.carImage,
        carImage2: data.carImage2,
        carImage3: data.carImage3,
        carImage4: data.carImage4,
        plateNumber: data.plateNumber,
        carType: data.carType.trim(),
        carTypeId: data.carTypeId,
        createdAt: new Date(),
    }
    carssch.create(datad, callback);
}

module.exports.addCarsAsync = function (data, callback) {
    data.createdAt = new Date();
    return carssch.create(data, callback);
}

module.exports.removeCars = function (id, callback) {
    var query = { _id: id };
    carssch.remove(query, callback)
}


