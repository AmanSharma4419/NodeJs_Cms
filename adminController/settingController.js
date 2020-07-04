const mailModel = require('../models/mailTemplate');
const configModel = require('../models/config');
const basicSettingModel = require('../models/basicSetting');
const smsModel = require('../models/smsTemplate');
const promocodeModel = require('../models/promocodes');
const userModel = require('../models/userTable');
const ObjectId = require('objectid');
var aws = require('aws-sdk');
const fs = require('fs')
const userHelper = require('../helper/user');
const async = require('async');
const env = require('../config/env')();
var authroute = require('../middleware/auth.js');

aws.config.update({
  secretAccessKey: env.S3BUCKET.SECRET_ACCESS_KEY,
  accessKeyId: env.S3BUCKET.SECRET_ACCESS_ID,
  region: env.S3BUCKET.REGION_NAME 
});
var s3 = new aws.S3();

module.exports = {

  addPromoCode: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { promocode, type, amount, maxAmount, createdBy, name, detials, createdAt, city, state, country, list, level, upto, visible, limit, tc } = req.body;
      
      if (!promocode){
        return res.json(helper.showValidationErrorResponse('PROMOCODE_REQUIRED')); 
      } 
      let promodata = {
        promocode:promocode
      }
      let promo  = await promocodeModel.findpromocode(promodata);
      if(promo){
        return res.json(helper.showValidationErrorResponse('Promocode already exist')); 
      }
      if (type != 'Flat' && type != 'Percent') {
        return res.json(helper.showValidationErrorResponse('TYPE_NOT_MATCHED'));
      } 
      if (!amount){
        return res.json(helper.showValidationErrorResponse('AMOUNT_REQUIRED'));
      } 
      if (!maxAmount) {
        return res.json(helper.showValidationErrorResponse('MAX_AMOUNT_REQUIRED'));
      } 
      if(parseInt(amount)>parseInt(maxAmount)){
        return res.json(helper.showValidationErrorResponse('Amount is greater than maximum amount')); 
      }
      if (!state) {
        return res.json(helper.showValidationErrorResponse('STATE_REQUIRED'));
      } 
      /*if (!list){
        return res.json(helper.showValidationErrorResponse('LIST_REQUIRED'));
      } */
      if (!level){
        return res.json(helper.showValidationErrorResponse('LEVEL_REQUIRED'));
      } 
      if (!upto) {
        return res.json(helper.showValidationErrorResponse('UPTODATE_REQUIRED'));
      } 
      let promocodeNew = new promocodeModel({
        promocode: promocode,
        type: type,
        amount: amount,
        maxAmount: maxAmount,
        createdBy: createdBy,
        name: name,
        detials: detials,
        createdAt: createdAt,
        level: level,
        upto: new Date(new Date(new Date(upto).setHours(23, 59, 59, 999)).toString().split('GMT')[0] + ' UTC').toISOString(),           //new Date(upto).setHours(),
        visible: visible,
        createdAt: new Date(),
        limit: limit,
        TC: tc
      });
      promocodeNew.save(function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('PROMOCODE_SAVED', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },
  updatePromocodeStatus: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { id, status } = req.body;
      if (!ObjectId.isValid(id)){
        return res.json(helper.showValidationErrorResponse('PROMOID_INVALID'));
      } 
      promocodeModel.updateStatus(id, status, function (err, data) {
        if (err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        return res.json(helper.showSuccessResponse('PROMOCODE_SAVED', data));
      })
    }catch(error){
      //console.log("Error",error);
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },
  editPromocode: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { promoId, promocode, type, amount, maxAmount, createdBy, name, detials, createdAt, city, state, country,level, upto, visible, limit, tc } = req.body;
      if (!ObjectId.isValid(promoId)){
        return res.json(helper.showValidationErrorResponse('PROMOID_INVALID'));
      } 
      let obj = {};
      if (promocode) obj.promocode = promocode;
      if (type) obj.type = type;
      if (amount) obj.amount = amount;
      if (maxAmount) obj.maxAmount = maxAmount;
      if (createdBy) obj.createdBy = createdBy;
      if (name) obj.name = name;
      if (detials) obj.detials = detials;
      if (city) obj.city = city;
      if (state) obj.state = state;
      if (country) obj.country = country;
      if (level) obj.level = level;
      if (upto) obj.upto = upto;
      if (visible) obj.visible = visible;
      if (limit) obj.limit = limit;
      if (tc) obj.TC = tc;
      promocodeModel.findOneAndUpdate({ _id: ObjectId(promoId) }, { $set: obj }, { new: true }, function (err, data) {
        if (err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else {
          return res.json(helper.showSuccessResponse('PROMOCODE_UPDATED', data));
        }
      })
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getPromocodeList: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      let obj = {};
      let data = req.body;
      var pageSize       = data.limit  || 10;
      var sortByField    = data.orderBy || "createdAt";
      var sortOrder      = data.order   || -1;
      var paged          = data.page || 1;

      if(data.fieldName && data.fieldValue) {
        obj[data.fieldName] = { $regex : data.fieldValue || '', $options : 'i'};
      }
      if (data.startDate) obj.createdAt = { $gte: new Date(data.startDate) };
      if (data.endDate) obj.createdAt = { $lte: new Date(data.endDate) };
      let count = await promocodeModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
      promocodeModel.getPromocodeList(obj,sortByField,sortOrder,paged,pageSize,(err,data)=>{
        if(err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else{
          let datacount = count[0]?count[0].count:0
          return res.json(helper.showSuccessResponseCount('PROMOCODE_LIST', data, datacount));
        }
      })
    }catch(error){
      //console.log("Error",error);
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getPromocodeDetails: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      let promoId = req.params.id;
      if (!ObjectId.isValid(promoId)) {
        return res.json(helper.showValidationErrorResponse('PROMOID_INVALID'));
      } 
  
      promocodeModel.find({ _id: ObjectId(promoId) }, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('PROMOCODE_DETAILS', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  promocodeDelete: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      let promoId = req.params.id;
      if (!ObjectId.isValid(promoId)){
        return res.json(helper.showValidationErrorResponse('PROMOID_INVALID'));
      } 
      promocodeModel.remove({ _id: ObjectId(promoId) }, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else {
          return res.json(helper.showSuccessResponse('PROMOCODE_DELETED', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  deleteMultiplePromocode: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      let deleteQuery = [];
      let promoArray = req.body.promoArray;
      if (!promoArray || !promoArray.length) { 
        return res.json(helper.showValidationErrorResponse('PROMOCODE_ID_REQUIRED'));
      }
      promoArray.forEach(promoId => {
        if (!ObjectId.isValid(promoId)){
          return res.json(helper.showValidationErrorResponse('PROMOCODEID_INVALID'));
        } 
        deleteQuery.push(ObjectId(promoId));
      });
      promocodeModel.remove({ _id: { $in: deleteQuery } }, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('PROMOCODE_DELETED', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getMailTitle: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      mailModel.find({ status: 1 }, function (err, data) {
        if (err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else {
          return res.json(helper.showSuccessResponse('MAIL_TITLE_DATA', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }  
  },

  editMailTemplate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { mailTitleId, body, emailTitle, adminEmailInfo, title, } = req.body;
      if (!ObjectId.isValid(mailTitleId)){
        return res.json(helper.showValidationErrorResponse('MAIL_TITLE_ID_INVALID'));
      }
      if (!body){
        return res.json(helper.showValidationErrorResponse('MAIL_BODY_REQUIRED'));
      } 
      if (!emailTitle){
        return res.json(helper.showValidationErrorResponse('MAIL_TITLE_REQUIRED'));
      } 
      if (!adminEmailInfo){
        return res.json(helper.showValidationErrorResponse('ADMIN_EMAIL_INFO_REQUIRED'));
      } 
      if (!title){
        return res.json(helper.showValidationErrorResponse('TITLE_REQUIRED'));
      } 
      mailModel.findOneAndUpdate({ _id: ObjectId(mailTitleId) }, { $set: { body: body, emailTitle: emailTitle, adminEmailInfo: adminEmailInfo, title: title } },
        { new: true }, function (err, data) {
          if (err) {
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
          }
          else {
            return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
          }
        });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  addMailTemplate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { body, emailTitle, adminEmailInfo, title, } = req.body;
      if (!body){
        return res.json(helper.showValidationErrorResponse('MAIL_BODY_REQUIRED'));
      } 
      if (!emailTitle){
        return res.json(helper.showValidationErrorResponse('MAIL_TITLE_REQUIRED'));
      } 
      if (!adminEmailInfo){
        return res.json(helper.showValidationErrorResponse('ADMIN_EMAIL_INFO_REQUIRED'));
      } 
      if (!title) {
        return res.json(helper.showValidationErrorResponse('TITLE_REQUIRED'));
      } 
      let mailNew = new mailModel({
        body: body,
        emailTitle: emailTitle,
        adminEmailInfo: adminEmailInfo,
        title: title,
      })
      mailNew.save(function (err, data) {
        if (err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else {
          return res.json(helper.showSuccessResponse('SAVE_SUCCESS', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getSmsTemplate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      smsModel.find({ status: 1 }, function (err, data) {
        if (err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else {
          return res.json(helper.showSuccessResponse('SMS_DETAIL', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  editSmsTemplate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { smsTemplateId, body, title } = req.body;
      if (!ObjectId.isValid(smsTemplateId)){
        return res.json(helper.showValidationErrorResponse('SMS_TEMPLATE_ID_INVALID'));
      } 
      if (!body){
        return res.json(helper.showValidationErrorResponse('MESSAGE_BODY_REQUIRED'));
      } 
      if (!title){
        return res.json(helper.showValidationErrorResponse('TITLE_REQUIRED'));
      } 
      smsModel.findOneAndUpdate({ _id: ObjectId(smsTemplateId) }, { $set: { body: body, title: title } }, { new: true }, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  addSmsTemplate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { body, title } = req.body;
      if (!body){
        return res.json(helper.showValidationErrorResponse('MESSAGE_BODY_REQUIRED'));
      } 
      if (!title){
        return res.json(helper.showValidationErrorResponse('TITLE_REQUIRED'));
      } 
      let smsNew = new smsModel({ body: body, title: title });
      smsNew.save(function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('SAVE_SUCCESS', data));
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getSmsTemplateById: async (req,res) => {
     try{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
          return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        const SmsId  = req.params.id;
        if(!ObjectId.isValid(SmsId)){
          return res.json(helper.showValidationErrorResponse('SMS_TEMPLATE_ID_INVALID'));
        } 
        smsModel.find({_id:SmsId},function(err,data){
          if (err){
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
          }
          return res.json(helper.showSuccessResponse('SMS_DETAIL', data));
        })
     }catch(error){
        return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
     }
  },

  getMailTemplateById: async (req,res) => {
      try{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
          return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        const MailId  = req.params.id;
        if(!ObjectId.isValid(MailId)){
          return res.json(helper.showValidationErrorResponse('MAIL_TEMPLATE_ID_INVALID'));
        } 
        mailModel.find({_id:MailId},function(err,data){
          if (err){
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
          } 
          return res.json(helper.showSuccessResponse('MAIL_DETAIL', data));
        })
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getConfigInfo: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      configModel.find({},'twilio mailgun Android_App_URL IOS_App_URL',function (err, data) {
        if(data[0])data[0].twilio.accountSid = data[0].twilio.accountSid.replace(/.(?=.{4})/g, '*');
        if(data[0])data[0].twilio.authToken = data[0].twilio.authToken.replace(/.(?=.{4})/g, '*');
        if(data[0])data[0].twilio.twilioFrom = data[0].twilio.twilioFrom.replace(/.(?=.{4})/g, '*');
        if(data[0])data[0].mailgun.MAILGUN_API_KEY = data[0].mailgun.MAILGUN_API_KEY.replace(/.(?=.{4})/g, '*');
        //console.log("Data", data);
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          return res.json(helper.showSuccessResponse('CONFIG_DETAIL', data));
        }
      })
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  twilioUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { accountSid, authToken, twilioFrom } = req.body;
      if (!accountSid){
        return res.json(helper.showValidationErrorResponse('ACCOUNT_SID_REQUIRED'));
      }
      if (!authToken){
        return res.json(helper.showValidationErrorResponse('AUTH_TOKEN_REQUIRED'));
      } 
      if (!twilioFrom){
        return res.json(helper.showValidationErrorResponse('TWILLIO_FROM_REQUIRED'));
      } 
      let obj = {
        'twilio.accountSid': accountSid,
        'twilio.authToken': authToken,
        'twilio.twilioFrom': twilioFrom,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  emailConfiguration: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { email, password } = req.body;
      if (!email){
        return res.json(helper.showValidationErrorResponse('EMAIL_REQUIRED'));
      } 
      if (!password){
        return res.json(helper.showValidationErrorResponse('PASSWORD_REQUIRED'));
      } 
      if (!userHelper.emailValidate(email)) {
        return res.json(helper.showValidationErrorResponse('ENTER_VALID_EMAIL'));
      } 
      let obj = {
        'FROM_MAIL.LOCALHOST': email,
        'FROM_MAIL.LIVE': email,
        'FROM_MAIL.STAGING': email,

        "SMTP_CRED.LOCALHOST.email": email,
        "SMTP_CRED.LOCALHOST.password": password,

        "SMTP_CRED.LIVE.email": email,
        "SMTP_CRED.LIVE.password": password,

        "SMTP_CRED.STAGING.email": email,
        "SMTP_CRED.STAGING.password": password,
      };
      configModel.find({}, function (err, data) {
        if (err) return res.json({ status: 0, message: 'Error in find query.' });
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  googlePlacesApiKeyUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Android_User_App_Google_key, Android_Provider_App_Google_Key, iOS_User_App_Google_Key, iOS_Provider_App_Google_Key, Web_App_Google_Key, Road_API_Google_Key } = req.body;
      if (!Android_User_App_Google_key) return res.json({ status: 0, message: 'Android_User_App_Google_key is required.' });
      if (!Android_Provider_App_Google_Key) return res.json({ status: 0, message: 'Android_Provider_App_Google_Key is required.' });
      if (!iOS_User_App_Google_Key) return res.json({ status: 0, message: 'iOS_User_App_Google_Key is required.' });
      if (!iOS_Provider_App_Google_Key) return res.json({ status: 0, message: 'iOS_Provider_App_Google_Key is required.' });
      if (!Web_App_Google_Key) return res.json({ status: 0, message: 'Web_App_Google_Key is required.' });
      if (!Road_API_Google_Key) return res.json({ status: 0, message: 'Road_API_Google_Key is required.' });

      let obj = {
        'google_Places_API_Key.Android_User_App_Google_key': Android_User_App_Google_key,
        'google_Places_API_Key.Android_Provider_App_Google_Key': Android_Provider_App_Google_Key,
        'google_Places_API_Key.iOS_User_App_Google_Key': iOS_User_App_Google_Key,
        'google_Places_API_Key.iOS_Provider_App_Google_Key': iOS_Provider_App_Google_Key,
        'google_Places_API_Key.Web_App_Google_Key': Web_App_Google_Key,
        'google_Places_API_Key.Road_API_Google_Key': Road_API_Google_Key,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  IOSAppURLUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { IOS_Client_App_URL, IOS_Driver_App_URL } = req.body;
      if (!IOS_Client_App_URL) return res.json({ status: 0, message: 'IOS_Client_App_URL is reuired.' })
      if (!IOS_Driver_App_URL) return res.json({ status: 0, message: 'IOS_Driver_App_URL is reuired.' })
  
      let obj = {
        'IOS_App_URL.IOS_Client_App_URL': IOS_Client_App_URL,
        'IOS_App_URL.IOS_Driver_App_URL': IOS_Driver_App_URL,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  AppNameUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Admin_Panel_Name, Partner_Panel_Name, Dispatcher_Panel_Name, Hotel_Panel_Name } = req.body;
      if (!Admin_Panel_Name){
        return res.json(helper.showValidationErrorResponse('ADMIN_PANEL_NAME_REQUIRED'));
      } 
      if (!Partner_Panel_Name){
        return res.json(helper.showValidationErrorResponse('PARTNER_PANEL_NAME_REQUIRED'));
      } 
      if (!Dispatcher_Panel_Name){
        return res.json(helper.showValidationErrorResponse('DISPATCHER_PANEL_NAME_REQUIRED'));
      } 
      if (!Hotel_Panel_Name) {
        return res.json(helper.showValidationErrorResponse('HOTEL_PANEL_NAME_REQUIRED'));
      } 

      let obj = {
        'AppName.Admin_Panel_Name': Admin_Panel_Name,
        'AppName.Partner_Panel_Name': Partner_Panel_Name,
        'AppName.Dispatcher_Panel_Name': Dispatcher_Panel_Name,
        'AppName.Hotel_Panel_Name': Hotel_Panel_Name,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));   
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)); 
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  MailGunConfigUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM } = req.body;
      if (!MAILGUN_API_KEY){
        return res.json(helper.showValidationErrorResponse('MAIL_GUN_API_KEY_REQUIRED'));
      } 
      if (!MAILGUN_DOMAIN){
        return res.json(helper.showValidationErrorResponse('MAIL_GUN_DOMAIN_REQUIRED'));
      } 
      if (!MAILGUN_FROM){
        return res.json(helper.showValidationErrorResponse('MAIL_GUN_FROM_REQUIRED'));
      } 

      let obj = {
        'mailgun.MAILGUN_API_KEY': MAILGUN_API_KEY,
        'mailgun.MAILGUN_DOMAIN': MAILGUN_DOMAIN,
        'mailgun.MAILGUN_FROM': MAILGUN_FROM,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)); 
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)); 
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },
  PaymentConfigUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Default_Payment_Gateway, Stripe_Secret_Key, Stripe_Publishable_Key } = req.body;
      if (!Default_Payment_Gateway) {
        return res.json(helper.showValidationErrorResponse('DEFAULT_PAYMENT_REQUIRED'));
      } 
      if (!Stripe_Secret_Key){
        return res.json(helper.showValidationErrorResponse('STRIPE_SECRET_KEY_REQUIRED'));
      } 
      if (!Stripe_Publishable_Key){
        return res.json(helper.showValidationErrorResponse('STRIPE_PUBLISHABLE_KEY_REQUIRED'));
      }
  
      let obj = {
        'PaymentConfig.Default_Payment_Gateway': Default_Payment_Gateway,
        'PaymentConfig.Stripe_Secret_Key': Stripe_Secret_Key,
        'PaymentConfig.Stripe_Publishable_Key': Stripe_Publishable_Key,
      };
      configModel.find({}, function (err, data) {
        if (err) return res.json({ status: 0, message: 'Error in find query.' });
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  GcmApiKeyUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Android_User_App_GCM_Key, Android_Provider_App_GCM_Key } = req.body;
      if (!Android_User_App_GCM_Key) return res.json({ status: 0, message: 'Android_User_App_GCM_Key is reuired.' });
      if (!Android_Provider_App_GCM_Key) return res.json({ status: 0, message: 'Android_Provider_App_GCM_Key is reuired.' });

      let obj = {
        'GCM_API_KEY.Android_User_App_GCM_Key': Android_User_App_GCM_Key,
        'GCM_API_KEY.Android_Provider_App_GCM_Key': Android_Provider_App_GCM_Key,
      };
      configModel.find({}, function (err, data) {
        if (err) return res.json({ status: 0, message: 'Error in find query.' });
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  AndroidAppUrlUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Android_Client_App_URL, Android_Driver_App_URL } = req.body;
      if (!Android_Client_App_URL) return res.json({ status: 0, message: 'Android_Client_App_URL is reuired.' });
      if (!Android_Driver_App_URL) return res.json({ status: 0, message: 'Android_Driver_App_URL is reuired.' });
  
      let obj = {
        'Android_App_URL.Android_Client_App_URL': Android_Client_App_URL,
        'Android_App_URL.Android_Driver_App_URL': Android_Driver_App_URL,
      };
      configModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err) {
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  AppVersionUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Android_User_App_Version, Android_Provider_App_Version, IOS_User_App_Version, IOS_Provider_App_Version } = req.body;
      if (!Android_User_App_Version){
        return res.json(helper.showValidationErrorResponse('ANDROID_APP_VERSION_REQUIRED'));
      } 
      if (!Android_Provider_App_Version){
        return res.json(helper.showValidationErrorResponse('ANDROID_PROVIDER_APP_VERSION_REQUIRED'));
      } 

      if (!IOS_User_App_Version){
        return res.json(helper.showValidationErrorResponse('IOS_USER_APP_VERSION_REQUIRED'));
      } 
      if (!IOS_Provider_App_Version){
        return res.json(helper.showValidationErrorResponse('IOS_PROVIDER_APP_VERSION_REQUIRED'));
      } 

      let obj = {
        'AppVersion.Android_User_App_Version': Android_User_App_Version,
        'AppVersion.Android_Provider_App_Version': Android_Provider_App_Version,
        'AppVersion.IOS_User_App_Version': IOS_User_App_Version,
        'AppVersion.IOS_Provider_App_Version': IOS_Provider_App_Version,
      };
      configModel.find({}, function (err, data) {
        if (err) return res.json({ status: 0, message: 'Error in find query.' });
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              configModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            configModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  basicAppSetting: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Admin_Country, Admin_Phone_Number, Admin_Currency_Code, Admin_Currency, Admin_TimeZone, Display_Date_Timezone, Contact_Email, Provider_Timeout_in_seconds,
        Default_Search_Radius, Scheduled_Request_Pre_Start_Minutes, Number_of_loop_for_Scheduled_Requests,
        Driver_percentage_profit, Admin_percentage_profit, Ride_cancellation_charges, Price_per_km, Base_fare, Number_of_drivers_in_customer_app,
        Android_User_App_Force_Version, Android_Provider_App_Force_Version, IOS_User_App_Force_Version,
        IOS_Provider_App_Force_Version } = req.body;

        if (!Admin_Currency_Code){
          return res.json(helper.showValidationErrorResponse('ADMIN_CURRENCY_CODE_REQUIRED'));
        }
        if (!Admin_Phone_Number){
          return res.json(helper.showValidationErrorResponse('ADMIN_PHONE_NUMBER_REQUIRED'));
        } 
        if (!Admin_TimeZone){
          return res.json(helper.showValidationErrorResponse('ADMIN_TIMEZONE_REQUIRED'));
        } 
  
        if (!Contact_Email){
          return res.json(helper.showValidationErrorResponse('CONTACT_EMAIL_REQUIRED'));
        } 
        if (!Provider_Timeout_in_seconds){
          return res.json(helper.showValidationErrorResponse('PROVIDER_TIMEOUT_IN_SECONDS_REQUIRED'));
        } 
        if (!Default_Search_Radius){
          return res.json(helper.showValidationErrorResponse('DEFAULT_SEARCH_RADIUS_REQUIRED'));
        } 
  
        if (!Scheduled_Request_Pre_Start_Minutes){
          return res.json(helper.showValidationErrorResponse('SCHEDULE_REQUEST_PRE_START_MINUTE_IS_REQUIRED'));
        } 
        if (!Number_of_loop_for_Scheduled_Requests) {
          return res.json(helper.showValidationErrorResponse('NUMBER_OF_LOOP_FOR_SCHEDULED_REQUEST_IS_REQUIRED'));
        } 
  
        if (!Ride_cancellation_charges) {
          return res.json(helper.showValidationErrorResponse('RIDE_CANCELLATION_CHARGE_IS_REQUIRED'));
        } 
        if (!Number_of_drivers_in_customer_app) {
          return res.json(helper.showValidationErrorResponse('NUMBER_OF_DRIVER_REQUIRED'));
        } 
        if (!Android_User_App_Force_Version) {
          return res.json(helper.showValidationErrorResponse('ANDROID_APP_VERSION_REQUIRED'));
        }
        if (!Android_Provider_App_Force_Version){
          return res.json(helper.showValidationErrorResponse('ANDROID_PROVIDER_APP_VERSION_REQUIRED'));
        } 
        if (!IOS_User_App_Force_Version){
          return res.json(helper.showValidationErrorResponse('IOS_USER_APP_VERSION_REQUIRED'));
        } 
        if (!IOS_Provider_App_Force_Version){
          return res.json(helper.showValidationErrorResponse('IOS_PROVIDER_APP_VERSION_REQUIRED'));
        }
  
  
      let obj = {
        'App_Settings.Admin_Country': Admin_Country,
        'App_Settings.Admin_Currency_Code': Admin_Currency_Code,
        'App_Settings.Admin_Currency': Admin_Currency,
        'App_Settings.Admin_TimeZone': Admin_TimeZone,
        'App_Settings.Display_Date_Timezone': Display_Date_Timezone,
  
        'App_Settings.Contact_Email': Contact_Email,
        'App_Settings.Provider_Timeout_in_seconds': Provider_Timeout_in_seconds,
        'App_Settings.Default_Search_Radius': Default_Search_Radius,
        'App_Settings.Scheduled_Request_Pre_Start_Minutes': Scheduled_Request_Pre_Start_Minutes,
        'App_Settings.Number_of_loop_for_Scheduled_Requests': Number_of_loop_for_Scheduled_Requests,
        'App_Settings.Admin_Phone_Number': Admin_Phone_Number,
  
        'App_Settings.Ride_cancellation_charges': Ride_cancellation_charges,
        'App_Settings.Driver_percentage_profit': Driver_percentage_profit,
        'App_Settings.Admin_percentage_profit': Admin_percentage_profit,
        'App_Settings.Price_per_km': Price_per_km,
        'App_Settings.Base_fare': Base_fare,
        'App_Settings.Number_of_drivers_in_customer_app': Number_of_drivers_in_customer_app,
        'App_Settings.Android_User_App_Force_Version': Android_User_App_Force_Version,
        'App_Settings.Android_Provider_App_Force_Version': Android_Provider_App_Force_Version,
        'App_Settings.IOS_User_App_Force_Version': IOS_User_App_Force_Version,
        'App_Settings.IOS_Provider_App_Force_Version': IOS_Provider_App_Force_Version,
      }
  
      basicSettingModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              basicSettingModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  const content = JSON.stringify(data, null, 4);
                  /*fs.writeFile('../meep-nodejs-customer-driver_api/basicsetting.json', content, 'utf8', function (err) {
                    if (err) {
                      console.log('error in creating files', err);
                    }
                    console.log("Setting file was saved!");
                  });*/
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            basicSettingModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  notificationSettingUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { SMS_Notification, Email_Notification, Tip, Toll, Android_User_App_Force_Update, Android_Provider_App_Force_Update, IOS_User_App_Force_Update, IOS_Provider_App_Force_Update } = req.body;
      let obj = {
        'Notifi_Settings.SMS_Notification': SMS_Notification,
        'Notifi_Settings.Email_Notification': Email_Notification,
        'Notifi_Settings.Tip': Tip,
        'Notifi_Settings.Toll': Toll,
        'Notifi_Settings.Android_User_App_Force_Update': Android_User_App_Force_Update,
        'Notifi_Settings.Android_Provider_App_Force_Update': Android_Provider_App_Force_Update,
        'Notifi_Settings.IOS_User_App_Force_Update': IOS_User_App_Force_Update,
        'Notifi_Settings.IOS_Provider_App_Force_Update': IOS_Provider_App_Force_Update,
      }
      basicSettingModel.find({}, function (err, data) {
        if (err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else {
          if (data && data.length > 0) {
            if (data.length == 1) {
              basicSettingModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, data) {
                if (err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } 
                else {
                  const content = JSON.stringify(data, null, 4);

                  /*fs.writeFile('../../meep-nodejs-customer-driver_api/basicsetting.json', content, 'utf8', function (err) {
                    if (err) {
                      console.log('error in creating files', err);
                    }
                    console.log("Setting file was saved!");
                  });*/
                  return res.json(helper.showSuccessResponse('UPDATE_SUCCESS',data));
                }
              });
            }
            else {
              return res.json(helper.showValidationErrorResponse('MULTIPLE_DATA'));
            }
          }
          else {
            basicSettingModel.create(obj,(err, data)=>{
              if (err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } 
              else {
                return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
              }
            })
          }
        }
      });
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  iOSCertificatesUpdate: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const { Certificate_Mode, iOS_User_app_push_Certificate, iOS_User_app_push_Key_file, iOS_User_app_push_passphrase, iOS_Provider_app_push_Certificate, iOS_Provider_app_push_Key_file, iOS_Provider_app_push_passphrase } = req.body;
      let files = req.files;
      let obj = {};
      if (Certificate_Mode) obj["iOS_Certificates.Certificate_Mode"] = Certificate_Mode;
      if (iOS_User_app_push_passphrase) obj["iOS_Certificates.iOS_User_app_push_passphrase"] = iOS_User_app_push_passphrase;
      if (iOS_Provider_app_push_passphrase) obj["iOS_Certificates.iOS_Provider_app_push_passphrase"] = iOS_Provider_app_push_passphrase;
      async.waterfall([
        function (callback) {
          if (files && Object.keys(files).length !== 0 && files.iOS_User_app_push_Certificate) {
            fs.readFile(files.iOS_User_app_push_Certificate.path, function (err, data) {
              if (err) { throw err; }
              var base64data = new Buffer(data, 'binary');
              var awsdata;
              var params = {
                Bucket: env.S3BUCKET.BUCKET_NAME,
                Key: Date.now().toString() + files.iOS_User_app_push_Certificate.name,
                Body: base64data,
                ACL: 'public-read'
              };
              s3.upload(params, function (err, awsData) {
                if (err) {
                  return res.json({ status: 0, messages: 'Error in uploading image.' });
                }
                else {
                  obj["iOS_Certificates.iOS_User_app_push_Certificate"] = awsData.Location;
                  callback(null, { data: awsData.Location });
                }
              });
            });
          }
          else {
            callback(null, [])
          }
        },
        function (data, callback) {
          if (files && Object.keys(files).length !== 0 && files.iOS_User_app_push_Key_file) {
            fs.readFile(files.iOS_User_app_push_Key_file.path, function (err, data) {
              if (err) { throw err; }
              var base64data = new Buffer(data, 'binary');
              var awsdata;
              var params = {
                Bucket: env.S3BUCKET.BUCKET_NAME,
                Key: Date.now().toString() + files.iOS_User_app_push_Key_file.name,
                Body: base64data,
                ACL: 'public-read'
              };
              s3.upload(params, function (err, awsData) {
                if (err) {
                  return res.json({ status: 0, messages: 'Error in uploading image.' });
                }
                else {
                  obj["iOS_Certificates.iOS_User_app_push_Key_file"] = awsData.Location;
                  callback(null, data, { data1: awsData.Location });
                }
              });
            });
          }
          else {
            callback(null, data, [])
          }
        },
        function (data, data1, callback) {
          if (files && Object.keys(files).length !== 0 && files.iOS_Provider_app_push_Certificate) {
            fs.readFile(files.iOS_Provider_app_push_Certificate.path, function (err, data) {
              if (err) { throw err; }
              var base64data = new Buffer(data, 'binary');
              var awsdata;
              var params = {
                Bucket: env.S3BUCKET.BUCKET_NAME,
                Key: Date.now().toString() + files.iOS_Provider_app_push_Certificate.name,
                Body: base64data,
                ACL: 'public-read'
              };
              s3.upload(params, function (err, awsData) {
                if (err) {
                  return res.json({ status: 0, messages: 'Error in uploading image.' });
                }
                else {
                  obj["iOS_Certificates.iOS_Provider_app_push_Certificate"] = awsData.Location;
                  callback(null, data, data1, { data2: awsData.Location });
                }
              });
            });
          }
          else {
            callback(null, data, data1, [])
          }
        },
        function (data, data1, data2, callback) {
          if (files && Object.keys(files).length !== 0 && files.iOS_Provider_app_push_Key_file) {
            fs.readFile(files.iOS_Provider_app_push_Key_file.path, function (err, data) {
              if (err) { throw err; }
              var base64data = new Buffer(data, 'binary');
              var awsdata;
              var params = {
                Bucket: env.S3BUCKET.BUCKET_NAME,
                Key: Date.now().toString() + files.iOS_Provider_app_push_Key_file.name,
                Body: base64data,
                ACL: 'public-read'
              };
              s3.upload(params, function (err, awsData) {
                if (err) {
                  return res.json({ status: 0, messages: 'Error in uploading image.' });
                }
                else {
                  obj["iOS_Certificates.iOS_Provider_app_push_Key_file"] = awsData.Location
                  callback(null, data, data1, data2, { data3: awsData.Location });
                }
              });
            });
          }
          else {
            callback(null, data, data1, data2, []);
          }
        },
        function (data, data1, data2, data3, callback) {
          basicSettingModel.find({}, function (err, data) {
            if (err) return res.json({ status: 0, message: 'Error in find query.' });
            else {
              if (data && data.length > 0) {
                if (data.length == 1) {
                  basicSettingModel.findOneAndUpdate({ _id: ObjectId(data[0]._id) }, { $set: obj }, { new: true }, function (err, resultData) {
                    if (err) return res.json({ status: 0, message: 'Error in basic notification setting update query.' });
                    else {
                      callback(null, resultData)
                    }
                  });
                }
                else {
                  return res.json({ status: 0, message: 'Multipale data in basicSetting table.' });
                }
              }
              else {
                basicSettingModel.create(obj,(err, data)=>{
                  if (err){
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                  } 
                  else {
                    return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
                  }
                })
              }
            }
          });
        }
      ], function (err, resultData) {
        return res.json({ status: 1, message: 'Successfuly updated.' });
      })
    }catch(error){
      return res.json({ status: 0, message: 'Error in update query.', error:error});
    }
  },

  getBasicSettingInfo: async (req, res) => {
    try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
          return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
      }
      basicSettingModel.find({}, function (err, data) {
        if (err) return res.json({ status: 0, message: 'Error in Basic Settings find query.' });
        else {
          return res.json({ status: 1, data: data });
        }
      });
    }catch(error){
      return res.json({ status: 0, message: 'Error in basic setting info.', error:error});
    }
  },

  changePassword: async (req,res) => {
     try{
      var verifydata = await authroute.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const data = req.body
      if(!data.customerid){
        return res.json(helper.showValidationErrorResponse('CUSTOMER_ID_REQUIRED'));
      }
      if(!data.oldpassword){
        return res.json(helper.showValidationErrorResponse('OLD_PASSWORD_REQUIRED'));
      }
      if(!data.newPassword){
        return res.json(helper.showValidationErrorResponse('NEW_PASSWORD_REQUIRED'))
      }
      data.newPassword = require('crypto').createHash('sha256').update(data.oldpassword).digest('hex');
      data.oldpassword = require('crypto').createHash('sha256').update(data.oldpassword).digest('hex');
      userModel.checkOldPassword(data.oldpassword,data.customerid,(err,data)=>{
           if(err){
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
           }
           if(data.length>0){
               userModel.changePassword(data.newpassword,data.customerid,(err,data)=>{
                      if(err){
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                      }else{
                        return res.json(helper.showSuccessResponse('UPDATE_SUCCESS', data));
                      }
               })
           }else{
              return res.json(helper.showSuccessResponse('OLD_PASSWORD_MISMATCH', data));
           }
      })

     }catch(error){
       //console.log("Error",error);
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
     }
  }

}
