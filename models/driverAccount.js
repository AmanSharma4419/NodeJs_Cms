var mongoose = require('mongoose');

var driverAccountSchema = mongoose.Schema({
    driverId:        {type: String, required: true},
    accountNumber:   {type: String, required: true , default: 'NA'},
    routingNumber:   {type: String, default: "NA"},
    mobileNumber:    {type: String, },
    name:            {type: String, default:'NA'},
    addedon:         {type: Date,},
})


const DAsch = module.exports =  mongoose.model('driverAccount' , driverAccountSchema);

module.exports.getAllAccount = (callback) => {
	DAsch.find({}, callback);
}

module.exports.getAccount = (data, callback) => {
	DAsch.findOne({driverId:data}, 'accountNumber name', callback);
}


module.exports.addAccount = (data, callback) => {
    var query = {driverId: data.driverId};
    var update = {
    driverId:        data.driverId,
    accountNumber:   data.accountNumber,
    routingNumber:   data.routingNumber,
    mobileNumber:    data.mobileNumber,
    name:            data.name,
    addedon:         new Date()
    }
	return DAsch.findOneAndUpdate(query, update, {upsert: true,fields : 'accountNumber', new:true},callback)
}
