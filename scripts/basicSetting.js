const basicSettingModel = require('../models/basicSetting');
var constant = require('../constants');
var mongoose = require('mongoose');
const async = require('async');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/'+ constant.DB_NAME, () => {
//console.log('you are connected to MongoDb');
insertSmsTitle();
});
mongoose.connection.on('error', (err) => {
//console.log('Mongdb connection failed due to error : ', err);
});
function insertSmsTitle() {
async.waterfall([
    function (callback) {
 basicSettingModel.create({

       'App_Settings.Admin_Country' : '',
       'App_Settings.Admin_Currency_Code' : '$',
       'App_Settings.Admin_Currency': '',
       'App_Settings.Admin_TimeZone' : 'EDT',
       'App_Settings.Display_Date_Timezone' : '',
       'App_Settings.Contact_Email' : '',
       'App_Settings.Admin_Phone_Number' : '',
       'App_Settings.Provider_Timeout_in_seconds' : '',
       'App_Settings.Default_Search_Radius' : '',
       'App_Settings.Scheduled_Request_Pre_Start_Minutes' : '',
       'App_Settings.Number_of_loop_for_Scheduled_Requests' : '',



       'Notifi_Settings.SMS_Notification' : true,
       'Notifi_Settings.Email_Notification': true,
       'Notifi_Settings.Tip' : true,
       'Notifi_Settings.Toll' : true,
       'Notifi_Settings.Android_User_App_Force_Update' : true,
       'Notifi_Settings.Android_Provider_App_Force_Update' : true,
       'Notifi_Settings.IOS_User_App_Force_Update' : true,
       'Notifi_Settings.IOS_Provider_App_Force_Update' : true,


       'iOS_Certificates.Certificate_Mode' : '',
       'iOS_Certificates.iOS_User_app_push_Certificate' : '',
       'iOS_Certificates.iOS_User_app_push_Key_file' : '',
       'iOS_Certificates.iOS_User_app_push_passphrase' : '',
       'iOS_Certificates.iOS_Provider_app_push_Certificate' : '',
       'iOS_Certificates.iOS_Provider_app_push_Key_file' : '',
       'iOS_Certificates.iOS_Provider_app_push_passphrase' : '',

        
       'App_Settings.Ride_cancellation_charges' : '',
       'App_Settings.Driver_percentage_profit' : '',
       'App_Settings.Price_per_km' : '',
       'App_Settings.Base_fare' : '',
    
       'App_Settings.Android_User_App_Force_Version' : ``,
       'App_Settings.Android_Provider_App_Force_Version' : ``,
       'App_Settings.IOS_User_App_Force_Version' : ``,
       'App_Settings.IOS_Provider_App_Force_Version' : ``,

       'social_settings.facebook_follow': '',
        'social_settings.instagram_follow': '', 
        'social_settings.twitter_follow': '',


 } ,function(err,data){
   if(err){
       //console.log("Error in inserting Basic Setting Query.");
       process.exit();
     }
     else{
       callback(null,data)
     }
   });
 },

], function(err, data){
  //console.log("successfully saved Basic Setting.");
  process.exit();
});
}
