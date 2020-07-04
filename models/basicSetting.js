const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const basicSettingSchema = new Schema({
  App_Settings: {
    Admin_Country : { type: String, default: '' },
    Admin_Currency_Code : { type: String, default: '' },
    Admin_Currency : { type: String, default: '' },
    Admin_TimeZone : { type: String, default: '' },
    Display_Date_Timezone : { type: String, default: '' },
    Admin_Phone_Number : { type: String, default: '' },
    // Admin_Email_Address : { type: String, default: '' },
    Contact_Email : { type: String, default: '' },
    Provider_Timeout_in_seconds : { type: String, default: '' },
    Default_Search_Radius : { type: String, default: '' },
    Scheduled_Request_Pre_Start_Minutes : { type: String, default: '' },
    Number_of_loop_for_Scheduled_Requests : { type: String, default: '' },
    Ride_cancellation_charges:{ type: String, default: '' },
    Driver_percentage_profit:{ type: String, default: '' },
    Price_per_km:{ type: String, default: '' },
    Base_fare:{ type: String, default: '' },
    Number_of_drivers_in_customer_app: { type: String, default: '' },
    Android_User_App_Force_Version : {type: Number, default: 0},
    Android_Provider_App_Force_Version : {type: Number, default: 0},
    IOS_User_App_Force_Version : {type: String, default: ``},
    IOS_Provider_App_Force_Version : {type: String, default: ``},
  },


  Notifi_Settings :{
    SMS_Notification : {type: Boolean, default: true},
    Email_Notification: {type: Boolean, default: true},
    Tip : {type: Boolean, default: true},
    Toll : {type: Boolean, default: true},
    Android_User_App_Force_Update : {type: Boolean, default: true},
    Android_Provider_App_Force_Update : {type: Boolean, default: true},
    IOS_User_App_Force_Update : {type: Boolean, default: true},
    IOS_Provider_App_Force_Update : {type: Boolean, default: true},

  },

iOS_Certificates :{
  Certificate_Mode : { type: String, default: '' },
  iOS_User_app_push_Certificate : { type: String, default: '' },
  iOS_User_app_push_Key_file : { type: String, default: '' },
  iOS_User_app_push_passphrase : { type: String, default: '' },
  iOS_Provider_app_push_Certificate : { type: String, default: '' },
  iOS_Provider_app_push_Key_file : { type: String, default: '' },
  iOS_Provider_app_push_passphrase : { type: String, default: '' },
},
social_settings : {
        facebook_follow: { type: String, default: '' },
        instagram_follow: { type: String, default: '' }, 
        twitter_follow: { type: String, default: '' },
    }

}, { timestamps: true });

basicSettingSchema.set('toObject');
basicSettingSchema.set('toJSON');
const basicTable = module.exports = mongoose.model('BasicSetting', basicSettingSchema);

module.exports.getAppSetting = (callback) => {
  basicTable.findOne({}, 'App_Settings', callback);
}