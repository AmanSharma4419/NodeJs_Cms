var mongoose = require('mongoose');
// can add city and country for more dynamic nature
// add var for enum here and dynamic list here
var paymentoptions = mongoose.Schema({
    hotelId: {type: String},
    type:       {type: String},  // need to add enum here
    logo:       {type: String},
    name:       {type: String},
    lastd:      {type: String},
    token:      {type: String},
    detials:    {type: String},
    lastUsed:   {type: Date},
    selected:   {type: Date}    
})


const POssch = module.exports =  mongoose.model('hotelpaymentoption' , paymentoptions);

module.exports.getDetailsOfAll = (callback) => {
	POssch.find({}, callback);
}

module.exports.getPObyHotelId = (data, callback) => {
	POssch.find({hotelId:data.hotelId}, callback);
}

module.exports.getPObyHotelIdAsync = (data, callback) => {
	return POssch.find({hotelId:data.hotelId}, callback);
}

module.exports.getPObyId = (data) => {
	return POssch.findById(data );
}

module.exports.getSelectedPO = (hotelId, callback) => {
	POssch.findOne({hotelId:hotelId},null,{sort: '-selected' }, callback);
}

module.exports.getUserSelectedPO = (hotelId, callback) => {
	return POssch.find({hotelId:hotelId},null,{sort: '-selected' }, callback);
}

module.exports.addPaymentOptions = function(data, callback){
    var query={
        hotelId: data.hotelId,
        lastd: data.lastd
    }
    var update = {
        hotelId: data.hotelId,
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
        hotelId: data.hotelId,
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
        hotelId: data.hotelId,
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

