const configModel = require('../models/config');
var constant = require('../constants');
var mongoose = require('mongoose');
const async = require('async');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/' + constant.DB_NAME, () => {
  //console.log('you are connected to MongoDb');
  insertConfigInfo();
});
mongoose.connection.on('error', (err) => {
  //console.log('Mongdb connection failed due to error : ', err);
});
function insertConfigInfo() {
  async.waterfall([
    function (callback) {
      configModel.create({

        LOCALURL: 'http://localhost:5000/',
        STAGEURL: 'http://localhost:5000/',
        PRODURL: '',
        LIVEURL: '',
        STAGINGURL: '',
        EMAIL: '',
        JWTOKENLOCAL: 'fax42c62-g215-4dc1-ad2d-sa1f32kk1w22',
        JWTOKENSTAGING: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
        JWTOKENDEV: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
        JWTOKENLIVE: 'asd42e62-g465-4bc1-ae2c-da1f27kk3a20',
        "key.privateKey": 'c3f42e68-b461-4bc1-ae2c-da9f27ee3a20',
        "key.tokenExpiry": 1 * 30 * 1000 * 60 * 24,

        "FROM_MAIL.LOCALHOST": "elite@gmail.com",
        "FROM_MAIL.LIVE": "elite@gmail.com",
        "FROM_MAIL.STAGING": "elite@gmail.com",

        "SMTP_CRED.LOCALHOST.email": 'elite@gmail.com',
        "SMTP_CRED.LOCALHOST.password": '123456789mobilyte',

        "SMTP_CRED.LIVE.email": 'elite@gmail.com',
        "SMTP_CRED.LIVE.password": '123456789mobilyte',

        "SMTP_CRED.STAGING.email": 'elite@gmail.com',
        "SMTP_CRED.STAGING.password": '123456789mobilyte',

        "AWS.SECRET_ACCESS_KEY": "tm/6az4Ot57YzVhAAD+9tuw59sf0lWVLpfvo7Gfc",
        "AWS.SECRET_ACCESS_ID": "AKIAT3I4BCUADQFFBUGQ",
        "AWS.REGION_NAME": "ap-south-1",
        "AWS.BUCKET_NAME": "eliteapp",

        "twilio.accountSid": 'AC8ee83ba1321de14ece9a98f177aad554',
        'twilio.authToken': '60cca931068daf5a2a8687f096ab25fd',
        'twilio.twilioFrom': '+18336759433',

        'google_Places_API_Key.Android_User_App_Google_key': '',
        'google_Places_API_Key.Android_Provider_App_Google_Key': '',
        'google_Places_API_Key.iOS_User_App_Google_Key': '',
        'google_Places_API_Key.iOS_Provider_App_Google_Key': '',
        'google_Places_API_Key.Web_App_Google_Key': '',
        'google_Places_API_Key.Road_API_Google_Key': '',

        'IOS_App_URL.IOS_Client_App_URL': '',
        'IOS_App_URL.IOS_Driver_App_URL': '',

        'AppName.Admin_Panel_Name': '',
        'AppName.Partner_Panel_Name': '',
        'AppName.Dispatcher_Panel_Name': '',
        'AppName.Hotel_Panel_Name': '',

        'PaymentConfig.Default_Payment_Gateway': 'Stripe',
        'PaymentConfig.Stripe_Secret_Key': 'sk_test_QxioQvyU85zxufSvaDuGZJnK',
        'PaymentConfig.Stripe_Publishable_Key': 'pk_test_LLAdXVApiHYl2QUmtHy2HiHT',

        'mailgun.MAILGUN_API_KEY': '8a31b074096b5268ffb21c1070282f55-9ce9335e-7f034331',
        'mailgun.MAILGUN_DOMAIN': 'mail.touchbytes.com',
        'mailgun.MAILGUN_FROM': 'Elite <gurpreet@touchbytes.com>',


        'GCM_API_KEY.Android_User_App_GCM_Key': '',
        'GCM_API_KEY.Android_Provider_App_GCM_Key': '',

        'Android_App_URL.Android_Client_App_URL': '',
        'Android_App_URL.Android_Driver_App_URL': '',

        'AppVersion.Android_User_App_Version': '',
        'AppVersion.Android_Provider_App_Version': '',
        'AppVersion.IOS_User_App_Version': '',
        'AppVersion.IOS_Provider_App_Version': '',



        "MONGODB.LOCALHOST.URL": 'mongodb://localhost:27017/suber',
        "MONGODB.TEST.URL": 'mongodb://localhost:27017/suber-test',
        "MONGODB.LIVE.URL": 'mongodb://localhost:27017/suber',
        "MONGODB.STAGING.URL": 'mongodb://localhost:27017/suber-stage',

      }, function (err, data) {
        if (err) {
          console.log("Error in inserting config.", err);
          process.exit();
        }
        else {
          callback(null, data)
        }
      });
    },

  ], function (err, data) {
    console.log("successfully saved config Info.");
    process.exit();
  });
}
