var mongoose = require('mongoose');
// can add city and country for more dynamic nature
// add var for enum here and dynamic list here
var paymentoptions = mongoose.Schema({
    dispatcherId: {type: String},
    type:       {type: String},  // need to add enum here
    logo:       {type: String},
    name:       {type: String},
    lastd:      {type: String},
    token:      {type: String},
    detials:    {type: String},
    lastUsed:   {type: Date},
    selected:   {type: Date}    
})


const POssch = module.exports =  mongoose.model('dispatcherpaymentoption' , paymentoptions);

module.exports.getDetailsOfAll = (callback) => {
	POssch.find({}, callback);
}

module.exports.getPObyDispatcherId = (data, callback) => {
	POssch.find({dispatcherId:data.dispatcherId}, callback);
}

module.exports.getPObyDispatcherIdAsync = (data, callback) => {
	return POssch.find({dispatcherId:data.dispatcherId}, callback);
}

module.exports.getPObyId = (data) => {
	return POssch.findById(data );
}

module.exports.getSelectedPO = (dispatcherId, callback) => {
	POssch.findOne({dispatcherId:dispatcherId},null,{sort: '-selected' }, callback);
}

module.exports.getUserSelectedPO = (dispatcherId, callback) => {
	return POssch.find({dispatcherId:dispatcherId},null,{sort: '-selected' }, callback);
}

module.exports.addPaymentOptions = function(data, callback){
    var query={
        dispatcherId: data.dispatcherId,
        lastd: data.lastd
    }
    var update = {
        dispatcherId: data.dispatcherId,
        type:       data.type,  // need to add enum here
        logo:       data.logo,
        name:       data.name,
        lastd:      data.lastd,
        token:      data.token,
        detials:    data.detials,
        selected:   new Date(),
        lastUsed:   new Date()
    }
    POssch.findOneAndUpdate(query, update, { upsert: true,"new": true}, callback);
}

module.exports.updateSelected = function(data, callback){
    var query={
        _id: data._id,
        dispatcherId: data.dispatcherId,
    }
    var update = {
        selected:   new Date()
    }
    console.log(query);
    POssch.findOneAndUpdate(query, update, {"new": true}, callback);
}

module.exports.updateLastUsed = function(data, callback){
    var query={
        id: data._id,
        dispatcherId: data.dispatcherId,
    }
    var update = {
        selected:   new Date(),
        lastUsed:   new Date()
    }
    
    POssch.findOneAndUpdate(query, update, {"new": true}, callback);
}

module.exports.removePO = function(id, callback){
    var query = {_id: id};
	POssch.remove(query, callback)
}

