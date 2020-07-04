var mongoose = require('mongoose');

var CountrySchema = mongoose.Schema({
    countryName: { type: String, default: "", unique: true, trim: true },
    countryCode: { type: String, default: "" },
    alpha2: { type: String, default: "" },
    alpha3: { type: String, default: "" },
    flagUrl: { type: String, default: "" },
    currencyCode: { type: String, default: "" },
    currencySign: { type: String, default: "" },
    countryTimezones: { type: Array, default: [] },
    countryPhoneCode: { type: String, default: "" },
    status: { type: String, enum: ["yes", "no"], default: "yes" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

CountrySchema.index({ countryName: 1, status: 1 }, { background: true });

const CountryTable = module.exports = mongoose.model('Country', CountrySchema);

//get all Countrys
module.exports.getAllCountries = function (callback) {
    CountryTable.find({}, callback);
}

module.exports.getEnabledCountries = (callback) => {
    CountryTable.find({ status: "yes" }, callback);
}

//add To Country
module.exports.addCountry = function (data, callback) {
    CountryTable.create(data, callback);
}

module.exports.getCountryById = (id, callback) => {
    CountryTable.findById(id, callback);
}

module.exports.getCountryByIdAsync = (id, callback) => {
    return CountryTable.findById(id, callback);
}

module.exports.isBusinessInCountry = (cc,callback) => {
    return CountryTable.findOne({ alpha2: cc, status: "yes" }, callback);
}

module.exports.updateCountry = (data, callback) => {
    var query = { _id: data.countryId };
    var update = {
        countryName: data.countryName
    }
    CountryTable.findOneAndUpdate(query, update, { "new": true }, callback);
}

//remove Country
module.exports.removeCountry = (id, callback) => {
    var query = { _id: id };
    CountryTable.remove(query, callback);
}