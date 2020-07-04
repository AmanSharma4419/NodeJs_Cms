var mongoose = require('mongoose');
// can add city and country for more dynamic nature
var listPmethods = mongoose.Schema({
    name: { type: String },
    type: { type: String },
    logo: { type: String },
    addedBy: { type: String },
    addedon: { type: Date },
    visible: { type: Boolean }
})


const PMssch = module.exports = mongoose.model('paymentmethods', listPmethods);

module.exports.getPMs = (callback) => {
    PMssch.find({}, callback);
}

module.exports.getPMsByName = (data) => {
    return PMssch.findOne({ name: data.name });
}

module.exports.getPMsByType = (data) => {
    return PMssch.findOne({ type: data.type });
}

module.exports.getPMsVisible = (callback) => {
    return PMssch.find({ visible: true }, callback);
}

module.exports.getPMsById = (id, callback) => {
    PMssch.findById({ _id: id }, callback);
}

module.exports.addPMs = function (data, callback) {
    var query = { type: data.type }
    var update = {
        name: data.name,
        type: data.type,
        logo: data.logo,
        addedBy: data.email,
        addedon: new Date(),
        visible: data.visible
    }
    PMssch.findOneAndUpdate(query, update, { upsert: true, "new": true }, callback);
}

module.exports.removePMs = function (id, callback) {
    var query = { _id: id };
    PMssch.remove(query, callback)
}