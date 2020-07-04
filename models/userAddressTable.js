var mongoose = require('mongoose');

var addressSchema = mongoose.Schema({
    customerId :{type:String},
    customerDetails : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    name: {type: String, default:""},
    address :      {type:Object, default:{}},
    createdAt:  {type: Date},
    UpdatedAt:  {type: Date}
},
{
    versionKey: false // You should be aware of the outcome after set to false
});
 
const addressTable = module.exports = mongoose.model('Address', addressSchema);

//get all addresses
module.exports.getAddresses = function(callback, limit) {
	addressTable.find(callback).limit(limit);
}

//Get User Address
module.exports.getUserAddress = function(data,callback) {
    addressTable.find({customerId:data},callback);
}

module.exports.getUserAddressAsync = function(data,callback) {
    return addressTable.find({customerId:data.customerId},callback).sort({createdAt:-1});
}

//get addresses async
module.exports.getAddressAsync = function(callback) {
	return addressTable.find(callback);
}

//add address
module.exports.addAddress = function(data, callback){
    data.createdAt = new Date();  
    addressTable.create(data,callback);
}

module.exports.updateAddress = function(data, callback){
    var query = {_id:data.addressId,customerId:data.customerId}
    data.createdAt = new Date();  
    addressTable.findOneAndUpdate(query,data,{ new : true},callback);
}

module.exports.updateDefaultTrue = function(data, callback){
    var query = {_id:data.addressId,customerId:data.customerId}
    data.createdAt = new Date(); 
    data.default = true;  
    return addressTable.findOneAndUpdate(query,data,{new : true},callback);
}

module.exports.updateOthertAddressFalse = function(data, callback){
    var query = {customerId:data.customerId}
    return addressTable.updateMany(query,{$set: {default: false}},{ new : true},callback);
}

//get Address by id
module.exports.getAddressById = (id, callback) => {
	addressTable.findById(id, callback);
}

module.exports.getAddressByIdAsync = (id, callback) => {
	return addressTable.findById(id, callback);
}

//remove category
module.exports.removeAddress = (id, callback) => {
	var query = {_id: id};
	addressTable.remove(query, callback);
}