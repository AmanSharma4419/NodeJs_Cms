var mongoose = require('mongoose');

var CityTypeSchema = mongoose.Schema({
    countryId: { type: String, default: "", required: true, trim: true },
    countryDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    cityId: { type: String, default: "", required: true, trim: true },
    cityDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    carTypeId: { type: String, default: "", required: true, unique: true },
    carTypeDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Cartype' },
    unit: { type: String, enum: ["km", "mile"], default: "km", lowercase: true },
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
    isSurgeTime: { type: String, enum: ["yes", "no"], default: "no" },
    surgeTimeList: [
        {
            dayStatus: { type: String, enum: ["yes", "no"], default: "no" },
            day: { type: Number },
            startTime: { type: String },
            endTime: { type: String },
            surgeMultiplier: { type: Number }
        }
    ],
    status: { type: String, enum: ["yes", "no"], default: "yes" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

//CityTypeSchema.index({ cityName: 1, status: 1 }, { background: true });

const CityTypeTable = module.exports = mongoose.model('CityType', CityTypeSchema);

//get all CityTypes
module.exports.getAllCityTypes = function (callback) {
    CityTypeTable.find({}, callback).sort({ createdAt: -1 });
}

module.exports.getEnabledCityTypes = (callback) => {
    CityTypeTable.find({ status: "yes" }, callback).sort({ createdAt: 1 });
}

//add To CityType
module.exports.addCityType = function (data, callback) {
    CityTypeTable.create(data, callback);
}

module.exports.getCityTypeById = (id, callback) => {
    CityTypeTable.findById(id, callback);
}

module.exports.getCityTypeByCityId = (cityId, callback) => {
    CityTypeTable.find({ cityId: cityId, status: "yes" })
        .populate({ path: "cityDetails", select: "cityTimezone" })
        .populate({ path: "carTypeDetails", select: "carType carImage" })
        .exec(callback);
}

module.exports.getCityTypeByCityIdAndCarTypeId = (data, callback) => {
    CityTypeTable.findOne({ cityId: data.cityId, carTypeId: data.carTypeId, status: "yes" })
        .populate({ path: "cityDetails", select: "cityTimezone" })
        .populate({ path: "carTypeDetails", select: "carType carImage" })
        .exec(callback);
}

module.exports.getCityTypeByIdAsync = (id, callback) => {
    return CityTypeTable.findById(id)
        .populate({ path: "carTypeDetails", select: "carType carImage" })
        .exec(callback);
}

module.exports.checkAlreadyAdded = (data, callback) => {
    return CityTypeTable.findOne({ countryId: data.countryId, cityId: data.cityId, carTypeId: data.carTypeId }, callback);
}

module.exports.updateCityType = (data, callback) => {
    var query = { _id: data.cityTypeId };
    CityTypeTable.findOneAndUpdate(query, data, { "new": true }, callback);
}

//remove CityType
module.exports.removeCityType = (id, callback) => {
    var query = { _id: id };
    CityTypeTable.remove(query, callback);
}