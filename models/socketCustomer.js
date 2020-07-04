var mongoose = require('mongoose');

var customerSocketSchema = mongoose.Schema({
    socketId:       {type: String},
    customerId :    {type: String},
    connectedAt:    {type: Date},
    firebase_token: {type: String,default:null},
    offline:        {type: String,enum:["yes","no"],default:"no"}
})

const SCsch = module.exports =  mongoose.model('SocketCustomer' , customerSocketSchema);

module.exports.findCSocket = (data,callback) => {
    return SCsch.findOne({customerId:data},callback);
}

module.exports.findCSocketCallback = (data,callback) => {
    SCsch.findOne({customerId:data},callback);
}

module.exports.addCustomerSocket = function(data, callback){
    var query= {customerId: data.customerId};
    var datad = {
        socketId:       data.socketId,
        customerId :    data.customerId,
        firebase_token : data.firebase_token,
        connectedAt:    new Date(),
        offline:        "no",
    }
    SCsch.findOneAndUpdate(query,datad,{upsert:true, new: true },callback);
}

module.exports.removeCustomer = function(data, callback){
    var query = {socketId: data};
    var datad = {
        offline:   "yes"
    }
    SCsch.findOneAndUpdate(query,datad,{upsert:false, new: true },callback);
    //SCsch.remove(query, callback)
    // addd sudo delete as firebase is integrated
}