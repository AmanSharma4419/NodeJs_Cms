const constants = require("../config/constants.js");
module.exports = () => {
  switch (process.env.NODE_ENV) {
    case 'dev':
      return {
        SITEURL: constants.STAGINGURL,
        MONGODB: constants.MONGODB.STAGING.URL,
        FROM_MAIL: constants.FROM_MAIL.LOCALHOST,
        SMTP_CRED: constants.SMTP_CRED.LOCALHOST,
        JWTOKEN: constants.JWTOKENDEV,
        STAGEURL: constants.STAGEURL,
        EXPIRY: constants.key.tokenExpiry,
        AWS: constants.AWS,
        FCM: constants.FCM,
      };
    case 'production':
      return {
        SITEURL: constants.LIVEURL,
        MONGODB: constants.MONGODB.LIVE.URL,
        FROM_MAIL: constants.FROM_MAIL.LIVE,
        SMTP_CRED: constants.SMTP_CRED.LIVE,
        JWTOKEN: constants.JWTOKENLIVE,
        STAGEURL: constants.PRODURL,
        EXPIRY: constants.key.tokenExpiry,
        S3BUCKET: constants.AWS,
        FCM: constants.FCM,
      };
    case 'staging':
      return {
        SITEURL: constants.STAGINGURL,
        MONGODB: constants.MONGODB.STAGING.URL,
        FROM_MAIL: constants.FROM_MAIL.STAGING,
        SMTP_CRED: constants.SMTP_CRED.STAGING,
        JWTOKEN: constants.JWTOKENSTAGING,
        STAGEURL: constants.STAGEURL,
        EXPIRY: constants.key.tokenExpiry,
        S3BUCKET: constants.AWS,
        FCM: constants.FCM,
      };
    case 'test':
      return {
        SITEURL: constants.LIVEURL,
        MONGODB: constants.MONGODB.TEST.URL,
        FROM_MAIL: constants.FROM_MAIL.LOCALHOST,
        SMTP_CRED: constants.SMTP_CRED.LOCALHOST,
        JWTOKEN: constants.JWTOKENLOCAL,
        STAGEURL: constants.STAGEURL,
        EXPIRY: constants.key.tokenExpiry,
        S3BUCKET: constants.AWS,
        FCM: constants.FCM,

      };
    default:
      return {
        SITEURL: constants.LOCALURL,
        MONGODB: constants.MONGODB.LOCALHOST.URL,
        FROM_MAIL: constants.FROM_MAIL.LOCALHOST,
        SMTP_CRED: constants.SMTP_CRED.LOCALHOST,
        JWTOKEN: constants.JWTOKENLOCAL,
        STAGEURL: constants.STAGEURL,
        EXPIRY: constants.key.tokenExpiry,
        S3BUCKET: constants.AWS,
        FCM: constants.FCM,

      };
  }
};
