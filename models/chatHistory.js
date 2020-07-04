var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
    customerId:           {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    driverId  :           {type: mongoose.Schema.Types.ObjectId, ref: 'driver'},
    chatId:               {type:String,required:true},
    chatRefId:            {type: mongoose.Schema.Types.ObjectId, ref: 'chat'},
    msg:                  {type: String,required:true},
    byCustomer:           {type:Boolean},
    byDriver:             {type:Boolean},
    createdAt:            {type: Date},
    updatedAt:            {type: Date}
},
{
    versionKey: false // You should be aware of the outcome after set to false
});
 
const messageTable = module.exports = mongoose.model('message', messageSchema);


module.exports.getChatHistory = (data,callback) => {
    messageTable.find({chatId:data.chatId})
    .populate({ path: 'driver', select: 'name profileImage email' })
    .populate({ path: 'User', select: 'name profileImage email'})
    .exec(callback);
    
}

module.exports.addMessage = (data,callback) => {
    var datad = {
        customerId : data.customerId,
        driverId : data.driverId,
        chatId : data.chatId,
        chatRefId : data.chatId,
        msg : data.msg,
        byCustomer : data.byCustomer,
        byDriver : data.byDriver,
        createdAt : new Date()
    }
    messageTable.create(datad,callback);
}
