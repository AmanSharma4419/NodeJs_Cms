var mongoose = require('mongoose');

var CitySchema = mongoose.Schema({
    countryId: { type: String, default: "", required: true, trim: true },
    countryCode: { type: String, trim: true, uppercase: true },
    countryDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    cityName: { type: String, default: "", unique: true, trim: true },
    cityCode: { type: String, default: "", uppercase: true },
    cityLocation: {
        type: { type: String, enum: ['Point'], required: true, default: "Point" },
        coordinates: { type: [Number], required: true, default: [] }
    },
    isUseBoundaryRadius: { type: Boolean, default: true },
    cityBoundaryRadius: { type: Number, default: 50 },
    cityGoogleCode: { type: String, default: "none", trim: true },
    cityTimezone: { type: String, default: '' },
    status: { type: String, enum: ["yes", "no"], default: "yes", lowercase: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

CitySchema.index({ cityName: 1, status: 1 }, { background: true });

CitySchema.index({ countryCode: 1, cityGoogleCode: 1, status: 1 }, { background: true });

const CityTable = module.exports = mongoose.model('City', CitySchema);

//get all Citys
module.exports.getAllCities = function (callback) {
    CityTable.find({}, callback).sort({createdAt:-1});
}

module.exports.getEnabledCities = (callback) => {
    CityTable.find({ status: "yes" }, callback).sort({createdAt:-1});
}

module.exports.getCityByCountryId = (data, callback) => {
    CityTable.find({ countryId: data.countryId }, callback).sort({createdAt:-1});
}

module.exports.getCityByCountryCodeAndCityGoogleCode = (data, callback) => {
    CityTable.findOne({ countryCode: data.countryCode, cityGoogleCode: data.cityCode, status: "yes" }, callback);
}

//add To City
module.exports.addCity = function (data, callback) {
    CityTable.create(data, callback);
}

module.exports.getCityById = (id, callback) => {
    CityTable.findById(id, callback);
}

module.exports.getCityByIdAsync = (id, callback) => {
    return CityTable.findById(id, callback);
}

module.exports.updateCity = (data, callback) => {
    var query = { _id: data.cityId };
    CityTable.findOneAndUpdate(query, data, { "new": true }, callback);
}

//remove City
module.exports.removeCity = (id, callback) => {
    var query = { _id: id };
    CityTable.remove(query, callback);
}