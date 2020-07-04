var mongoose = require('mongoose');

var adminSchema = mongoose.Schema({
    referFriend: {type: String,default:"null"},
    aboutUs: {type: String,default:"null"},
    createdAt: {type: Date},
    UpdatedAt:{type: Date},
},
{
    versionKey: false // You should be aware of the outcome after set to false
});
 
const Admin = module.exports = mongoose.model('Admin', adminSchema);


//add Admin Setting
module.exports.addAdminSetting = function(setting, callback){
    setting.createdAt = new Date();  
    Admin.create(setting,callback);
}

//get refer friend data
module.exports.getReferFriendText = function() {
	return Admin.findOne({},{ referFriend: 1 } );
}

//get About us data
module.exports.getAboutUsText = function() {
   return Admin.findOne({},{ aboutUs: 1 } );
}