const smsModel = require('../models/smsTemplate');
var constant = require('../constants');
var mongoose = require('mongoose');
const async = require('async');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/' + constant.DB_NAME, () => {
//console.log('you are connected to MongoDb');
insertSmsTitle();
});
mongoose.connection.on('error', (err) => {
//console.log('Mongdb connection failed due to error : ', err);
});
function insertSmsTitle() {
async.waterfall([
    function (callback) {
 smsModel.create( [
  { title: "USER_OTP_FORGOT_PASSWORD",body:"Forgot Password OTP is : XXXXXX",status:1},
  { title: "USER_REGISTER_OTP_VERIFICATION",body:"Dear User, OTP to complete your registration process is : XXXXXX",status:1},

  // { title: "TRIP_ACCEPTED",body:"Your Trip Accepted.",status:1},
  // { title: "WEEKLY_PAYMENT",body:"Your Weekly Payment.",status:1},

  // { title: "START_RIDE",body:"%USERNAME% Start ride with %PROVIDERNAME% Provider from Pickup %PICKUPADD% to Destination %DESTINATIONADD%",status:1},
  // { title: "RIDE_BOOKING",body:"Your Ride Booking Successfully.",status:1},
  // { title: "EMERGENCY_HELP",body:"%USERNAME% Need to help here.",status:1},
  
 ] ,function(err,data){
   if(err){
       console.log("Error in inserting SMS Template.", err);
       process.exit();
     }
     else{
       callback(null,data)
     }
   });
 },

], function(err, data){
  console.log("successfully save SMS Template.");
  process.exit();
});
}
