const mailModel = require('../models/mailTemplate');
var constant = require('../constants');
var mongoose = require('mongoose');
const async = require('async');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017'+ constant.DB_NAME, () => {
//console.log('you are connected to MongoDb');
insertMailTitle();
});
mongoose.connection.on('error', (err) => {
//console.log('Mongdb connection failed due to error : ', err);
});
function insertMailTitle() {
async.waterfall([
    function (callback) {
 mailModel.create( [
  { title: "USER_REGISTER",emailTitle:"Registration",body:"Hi,<br><br> Welcome to PeiTaxi , XXXXXX !",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "USER_RESET_PASSWORD",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "USER_CHANGE_PASSWORD",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  // { title: "USER_COMPLETE_TRIP",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  // { title: "USER_SCHEDULE_TRIP",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  
  // { title: "DRIVER_UPDATE_DOCUMENT",emailTitle:"Update Document",body:"Hi,<br><br> You have successfully updated your documents !",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "DRIVER_REGISTER",emailTitle:"Registration",body:"Hi,<br><br> Welcome to PeiTaxi , XXXXXX !",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "DRIVER_RESET_PASSWORD",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "DRIVER_FORGOT_PASSWORD_OTP",emailTitle:"Your OTP Verification",body:"Hi,<br><br> Email Verification code for complete your registration process is : XXXXXX.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "DRIVER_CHANGE_PASSWORD",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  // { title: "DRIVER_COMPLETE_TRIP",emailTitle:"Reset Password",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},	  
  { title: "ADMIN_APPROVE_DRIVER",emailTitle:"Admin approve driver",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "ADMIN_UNBLOCK_DRIVER",emailTitle:"Admin unblock driver",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
  { title: "ADMIN_REJECT_DRIVER",emailTitle:"Admin reject driver",body:"Hi,<br><br> Password is successfully reset to XXXXXX. Please don t forget to change the password once you log in next time.",adminEmailInfo:'For any query or consolation info@eber.com',status:1},
] ,function(err,data){
   if(err){
       console.log("Error in inserting Mail Template.", err);
       process.exit();
     }
     else{
       callback(null,data)
     }
   });
 },

], function(err, data){
  console.log("successfully save Mail Template.");
  process.exit();
});
}
