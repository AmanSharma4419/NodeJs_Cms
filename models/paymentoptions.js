var mongoose = require('mongoose');
// can add city and country for more dynamic nature
// add var for enum here and dynamic list here
var paymentoptions = mongoose.Schema({
    customerId: { type: String },
    type: { type: String },  // need to add enum here
    logo: { type: String },
    name: { type: String },
    lastd: { type: String },
    token: { type: String },
    detials: { type: Object },
    lastUsed: { type: Date },
    selected: { type: Date }
})


const POssch = module.exports = mongoose.model('paymentoptions', paymentoptions);

module.exports.getDetailsOfAll = (callback) => {
    POssch.find({}, callback);
}

module.exports.getPObyCustomerId = (data, callback) => {
    POssch.find({ customerId: data.customerId }, callback);
}

module.exports.getPObyCustomerIdAsync = (data, callback) => {
    return POssch.find({ customerId: data.customerId }, callback);
}

module.exports.getPObyId = (data) => {
    return POssch.findById(data);
}

module.exports.getSelectedPO = (customerId, callback) => {
    POssch.findOne({ customerId: customerId }, null, { sort: '-selected' }, callback);
}

module.exports.getUserSelectedPO = (customerId, callback) => {
    return POssch.find({ customerId: customerId }, null, { sort: '-selected' }, callback);
}

module.exports.addPaymentOptions = function (data, callback) {
   // console.log("Payment option data", data);
    var query = {
        customerId: data.customerId,
        lastd: data.lastd
    }
    
    var update = {
        customerId: data.customerId,
        type: data.type,  // need to add enum here
        logo: data.logo,
        name: data.name,
        lastd: data.lastd,
        token: data.token,
        detials: data.detials,
        selected: new Date(),
        lastUsed: new Date()
    }
    POssch.findOneAndUpdate(query, update, { upsert: true, "new": true }, callback);
}


module.exports.updateSelected = function (data, callback) {
    var query = {
        _id: data._id,
        customerId: data.customerId,
    }
    var update = {
        selected: new Date()
    }
    //console.log(query);
    POssch.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.updateLastUsed = function (data, callback) {
    var query = {
        id: data._id,
        customerId: data.customerId,
    }
    var update = {
        selected: new Date(),
        lastUsed: new Date()
    }

    POssch.findOneAndUpdate(query, update, { "new": true }, callback);
}

module.exports.removePO = function (id, callback) {
    var query = { _id: id };
    POssch.remove(query, callback)
}

