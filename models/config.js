const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configSchema = new Schema({
  LOCALURL: { type: String, default: '' },
  STAGEURL: { type: String, default: '' },
  PRODURL: { type: String, default: '' },
  LIVEURL: { type: String, default: '' },
  STAGINGURL: { type: String, default: '' },
  EMAIL: { type: String, default: '' },
  JWTOKENLOCAL: { type: String, default: 'fax42c62-g215-4dc1-ad2d-sa1f32kk1w22' },
  JWTOKENSTAGING: { type: String, default: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43' },
  JWTOKENDEV: { type: String, default: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43' },
  JWTOKENLIVE: { type: String, default: 'asd42e62-g465-4bc1-ae2c-da1f27kk3a20' },
  key: {
    privateKey: { type: String, default: 'c3f42e68-b461-4bc1-ae2c-da9f27ee3a20' },
    tokenExpiry: { type: String, default: 1 * 30 * 1000 * 60 * 24 }  //1 hour
  },

  FROM_MAIL: {
    LOCALHOST: { type: String, default: '' },
    LIVE: { type: String, default: '' },
    STAGING: { type: String, default: '' }
  },

  SMTP_CRED: {
    LOCALHOST: {
      email: { type: String, default: '' },
      password: { type: String, default: '123456' }
    },
    LIVE: {
      email: { type: String, default: '' },
      password: { type: String, default: '123456' }
    },
    STAGING: {
      email: { type: String, default: '' },
      password: { type: String, default: '123456' }
    },

  },
  AWS: {
    SECRET_ACCESS_KEY: { type: String, default: "tm/6az4Ot57YzVhAAD+9tuw59sf0lWVLpfvo7Gfc" },
    SECRET_ACCESS_ID: { type: String, default: "AKIAT3I4BCUADQFFBUGQ" },
    REGION_NAME: { type: String, default: "ap-south-1" },
    BUCKET_NAME: { type: String, default: "eliteapp" }
  },
  twilio: {
    accountSid: { type: String, default: '' },
    authToken: { type: String, default: '' },
    twilioFrom: { type: String, default: '' }

  },

  google_Places_API_Key: {
    Android_User_App_Google_key: { type: String, default: '' },
    Android_Provider_App_Google_Key: { type: String, default: '' },
    iOS_User_App_Google_Key: { type: String, default: '' },
    iOS_Provider_App_Google_Key: { type: String, default: '' },
    Web_App_Google_Key: { type: String, default: '' },
    Road_API_Google_Key: { type: String, default: '' },
  },

  IOS_App_URL: {
    IOS_Client_App_URL: { type: String, default: '' },
    IOS_Driver_App_URL: { type: String, default: '' }
  },

  AppName: {
    Admin_Panel_Name: { type: String, default: '' },
    Partner_Panel_Name: { type: String, default: '' },
    Dispatcher_Panel_Name: { type: String, default: '' },
    Hotel_Panel_Name: { type: String, default: '' },
  },

  PaymentConfig: {
    Default_Payment_Gateway: { type: String, default: '' },
    Stripe_Secret_Key: { type: String, default: '' },
    Stripe_Publishable_Key: { type: String, default: '' },
  },
  mailgun: {
    MAILGUN_API_KEY: { type: String, default: '' },
    MAILGUN_DOMAIN: { type: String, default: '' },
    MAILGUN_FROM: { type: String, default: '' },
  },

  GCM_API_KEY: {
    Android_User_App_GCM_Key: { type: String, default: '' },
    Android_Provider_App_GCM_Key: { type: String, default: '' },
  },

  Android_App_URL: {
    Android_Client_App_URL: { type: String, default: '' },
    Android_Driver_App_URL: { type: String, default: '' },
  },


  AppVersion: {
    Android_User_App_Version: { type: String, default: '' },
    Android_Provider_App_Version: { type: String, default: '' },
    IOS_User_App_Version: { type: String, default: '' },
    IOS_Provider_App_Version: { type: String, default: '' },
  },


  MONGODB: {
    LOCALHOST: {
      URL: { type: String, default: 'mongodb://localhost:27017/suber' },

    },
    TEST: {
      URL: { type: String, default: 'mongodb://localhost:27017/suber-test' },


    },
    LIVE: {
      URL: { type: String, default: 'mongodb://localhost:27017/suber' },

    },
    STAGING: {
      URL: { type: String, default: 'mongodb://localhost:27017/suber-stage' },

    },
  },

}, { timestamps: true });

configSchema.set('toObject');
configSchema.set('toJSON');

const configTable = module.exports = mongoose.model('config', configSchema);

module.exports.getTwillioSetting = (callback) => {
  configTable.findOne({}, 'twilio', callback);
}

module.exports.getAWSSetting = (callback) => {
  configTable.findOne({}, 'AWS', callback);
}

module.exports.getMailgunSetting = (callback) => {
  configTable.findOne({}, 'mailgun', callback);
}

module.exports.getStripeSetting = (callback) => {
  configTable.findOne({}, 'PaymentConfig', callback);
}
