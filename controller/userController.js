const User = require("../models/userTable.js");
const Driver = require("../models/drivertable");
const tempUser = require("../models/tempusertable.js");
const MailTemplate = require("../models/mailTemplate.js");
const smsTemplate = require("../models/smsTemplate.js");
const mailgunSendEmail = require("../lib/mailgunSendEmail.js");
const otpVerification = require("../lib/otpverification.js");
const jwt = require("jsonwebtoken");
const authroute = require("../middleware/auth.js");
const upload = require("../lib/awsimageupload.js");
const profileImageUpload = upload.single("profileImage");
const POs = require("../models/paymentoptions");
const PMs = require("../models/listPMethods");
const Trips = require("../models/triptable");
const socketCustomer = require("../models/socketCustomer");
const promos = require("../models/promocodes");
const Contact = require("../models/usercontacttable");
const csv = require("csvtojson");
const request = require("request");
var ChatHistory = require("../models/chatHistory");
var Chat = require("../models/chatTable");
var Car = require("../models/cartable");

module.exports = {
  csvImport: async (req, res) => {
    csv()
      .fromStream(request.get("http://3.12.72.231:5004/public/users.csv"))
      .subscribe((json) => {
        Object.keys(json).forEach(function (key) {
          console.table("Key : " + key + ", Value : " + json[key]);
        });
      });
  },

  getUsersList: async (req, res) => {
    try {
      User.getUsers((err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  importCsvList: async (req, res) => {
    try {
      var data = req.body;
      data.users.forEach(async (item, key) => {
        var userc = await User.findOne({ mobileNumber: item.mobilenumber });
        var userd = await User.findOne({ email: item.email });
        console.log("Data", userc);
        console.log("Data1", userd);
        if (userc == null && userd == null) {
          console.log("Inside data", userc);
          let savedata = {
            name: item.name,
            email: item.email,
            mobileNumber: item.mobilenumber,
            address: item.address,
          };
          await User.addUser(savedata, (data, errr) => {
            console.log("Database error", errr);
          });
        }
        if (key === data.users.length - 1) {
          return res.json(
            helper.showSuccessResponse("USER_REGISTERED_SUCCESS", data)
          );
        }
      });
    } catch (error) {
      console.log("Error", error);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userRegister: async (req, res) => {
    try {
      var data = req.body;
      var paramsList = [
        { name: "name", type: "string" },
        { name: "mobileNumber", type: "string" },
        { name: "email", type: "string" },
        { name: "address", type: "string" },
        { name: "password", type: "string" },
        //{ name: 'languageId', type: 'string' }
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          // if (!data.languageId) {
          //     return res.json(helper.showValidationErrorResponse('LANGUAGE_IS_REQUIRED'));
          // }

          // var getLanguage = await Language.getLanguageByIdAsync(data.languageId);

          // if (getLanguage == null) {
          //     return res.json(helper.showValidationErrorResponse('NOT_VALID_ID'));
          // }

          // data.languageDetails = getLanguage;

          if (!data.name) {
            return res.json(
              helper.showValidationErrorResponse("NAME_IS_REQUIRED")
            );
          }

          if (!data.mobileNumber) {
            return res.json(
              helper.showValidationErrorResponse("MOBILE_NUMBER_IS_REQUIRED")
            );
          }

          if (!data.email) {
            return res.json(
              helper.showValidationErrorResponse("EMAIL_IS_REQUIRED")
            );
          }

          if (!data.address) {
            return res.json(
              helper.showValidationErrorResponse("ADDRESS_IS_REQUIRED")
            );
          }

          if (!data.password) {
            return res.json(
              helper.showValidationErrorResponse("PASSWORD_IS_REQUIRED")
            );
          }

          var countryCode = "";
          var userc = null;

          if (data.fbid == "" && data.gid == "" && data.appleid == "") {
            var verifytempuser = await tempUser.getTempUserOTP(data);

            if (verifytempuser == null) {
              return res.json(
                helper.showValidationErrorResponse("ENTER_CORRECT_OTP")
              );
            }

            countryCode = verifytempuser.countryCode;

            data.fbid = null;
            data.gid = null;
            data.appleid = null;

            userc = await User.findOne({ mobileNumber: data.mobileNumber });
          } else {
            countryCode = data.countryCode;
            //console.log("check the usaedr reciewved >>>>>>>>>>>> ", data.fbid, 'data.gid   ', data.gid);
            if (data.fbid) {
              userc = await User.findOne({ fbid: data.fbid });
            } else if (data.gid) {
              userc = await User.findOne({ gid: data.gid });
            } else if (data.appleid) {
              userc = await User.findOne({ appleid: data.appleid });
            } else if (data.mobileNumber) {
              userc = await User.findOne({ mobileNumber: data.mobileNumber });
            }

            userc = await User.findOne({ email: data.email });
          }

          // console.log("check the usaedr reciewved >>>>>>>>>>>> ", userc);

          if (userc != null) {
            return res.json(helper.showValidationErrorResponse("USER_EXISTS"));
          } else {
            var hashedPassword = require("crypto")
              .createHash("sha256")
              .update(data.password)
              .digest("hex");
            console.log(hashedPassword, "crypto register ");
            var userd = {
              name: data.name,
              email: data.email,
              password: hashedPassword,
              countryCode: countryCode,
              city: data.city,
              address: data.address,
              profileImage: data.profileImage,
              mobileNumber: data.mobileNumber,
              //languageId: data.languageId,
              fbid: data.fbid || null,
              gid: data.gid || null,
              appleid: data.appleid || null,
              languageDetails: data.languageDetails,
              token: jwt.sign(
                {
                  email: data.email,
                  userId: data.password,
                },
                "secret",
                {
                  expiresIn: "2h",
                }
              ),
            };

            User.addUser(userd, async (err, user) => {
              if (err) {
                //console.log("check err user details e", err);
                return res.json(
                  helper.showValidationErrorResponse("USER_REGISTER")
                );
              } else {
                // module.exports.addCashPayment(user._id);
                /*var pmwallet = await PMs.getPMsByType({ type: "Wallet" });
                                var Wallet = {
                                    "customerId": user._id,
                                    "type": "Wallet",
                                    "name": "Wallet",
                                    "lastd": "Wallet",
                                    "token": null,
                                    "detials": "Wallet Payment Method"
                                }
                                Wallet.logo = pmwallet.logo;
                                POs.addPaymentOptions(Wallet, (err, resdata) => {
                                    if(err){
                                        console.log("Error in adding wallet payment", err);
                                    }else{
                                        
                                        module.exports.addCashPayment(user._id);
                                    } 
                                    
                                });*/
                res.json(
                  helper.showSuccessResponse("USER_REGISTERED_SUCCESS", user)
                );
              }
            });
          }
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (error) {
      //console.log("check reporpr", error);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  addCashPayment: async (customerId) => {
    try {
      var pmcash = await PMs.getPMsByType({ type: "Cash" });
    } catch (err) {}
    var Cash = {
      customerId: customerId,
      type: "Cash",
      name: "Cash",
      lasd: "Cash",
      token: null,
      detials: "Cash Payment Method",
    };

    Cash.logo = pmcash.logo;
    POs.addPaymentOptions(Cash, (err, resdata) => {});
  },

  userUpdateProfile: async (req, res) => {
    try {
      var data = req.body;

      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      data.mobileNumber = verifydata.mobileNumber;
      //console.log("check update ", data);

      if (!data.name) {
        return res.json(helper.showValidationErrorResponse("NAME_IS_REQUIRED"));
      }

      if (!data.mobileNumber) {
        return res.json(
          helper.showValidationErrorResponse("MOBILE_NUMBER_IS_REQUIRED")
        );
      }

      if (!data.email) {
        return res.json(
          helper.showValidationErrorResponse("EMAIL_IS_REQUIRED")
        );
      }

      if (!data.address) {
        return res.json(
          helper.showValidationErrorResponse("ADDRESS_IS_REQUIRED")
        );
      }

      data._id = verifydata._id;
      var updateProfile = await User.updateUserProfile(data);

      res.json(
        helper.showSuccessResponse("PROFILE_UPDATE_SUCCESS", updateProfile)
      );
    } catch (error) {
      //console.log("chgeck error ", error);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  changeUserPassword: async (req, res) => {
    try {
      var data = req.body;

      var paramsList = [
        { name: "password", type: "string" },
        { name: "confirmPassword", type: "string" },
        { name: "currentPassword", type: "string" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await authroute.validateCustomer(req);
          if (verifydata == null) {
            return res.json(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.password) {
            return res.json(
              helper.showValidationErrorResponse("PASSWORD_IS_REQUIRED")
            );
          }

          if (!data.confirmPassword) {
            return res.json(
              helper.showValidationErrorResponse("CNF_PASSWORD_IS_REQUIRED")
            );
          }

          if (!data.currentPassword) {
            return res.json(
              helper.showValidationErrorResponse("CURRENT_PASSWORD_IS_REQUIRED")
            );
          }

          var currentPassword = require("crypto")
            .createHash("sha256")
            .update(data.currentPassword)
            .digest("hex");

          if (currentPassword != verifydata.password) {
            return res.json(
              helper.showValidationErrorResponse("PASSWORD_MISSMATCH")
            );
          }

          var passmain = data.password;

          data.mobileNumber = verifydata.mobileNumber;
          data.password = require("crypto")
            .createHash("sha256")
            .update(data.password)
            .digest("hex");
          // console.log('User updatePassword', data);

          var upass = await User.updatePassword(data);
          //console.log('User updatePassword', upass);

          var mTemplate = await MailTemplate.findOne({
            title: "USER_CHANGE_PASSWORD",
          });
          //console.log(mTemplate);
          if (mTemplate == null || mTemplate == undefined) {
            var msg = __("PASSWORD_CHANGED_MSG", passmain);
            var sub = __("PASSWORD_CHANGED_SUBJECT", constant.APP_NAME);
            var senemail = await mailgunSendEmail.sendEmail(
              upass.email,
              sub,
              msg
            );
          } else {
            var msg = mTemplate.body.replace("XXXXXX", passmain);
            var senemail = await mailgunSendEmail.sendEmail(
              upass.email,
              mTemplate.emailTitle,
              msg
            );
            //console.log(senemail);
          }

          res.json(helper.showSuccessResponse("PASSWORD_CHANGED_SUCCESS", {}));
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (error) {
      //console.log("check error ", error);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  imageTest: async (req, res) => {
    var data = req.body;

    //var pictureData = new Buffer(data.pictureData, 'base64');

    upload.uploadImageToS3(data.pictureData, (err, respose) => {
      //console.log("err", err);
      //console.log(respose);
    });
  },

  userUploadProfileImage: async (req, res) => {
    try {
      profileImageUpload(req, res, async (err, some) => {
        console.log(req.file.location,"gettig the profile")
        var verifydata = await authroute.validateCustomer(req);
        // console.log("verify profile Data",verifydata);
        if (verifydata == null) {
          return res.json(
            helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
          );
        }

        var file = req.file;

        if (!file) {
          return res.json(
            helper.showValidationErrorResponse("IMAGE_IS_REQUIRED")
          );
        }

        if (err) {
          return res.json(
            helper.showAWSImageUploadErrorResponse(
              "IMAGE_UPLOAD_ERROR",
              err.message
            )
          );
        }

        var imageUrl = req.file.location;

        var cdata = {
          customerId: verifydata._id,
          profileImage: imageUrl,
          mobileNumber: verifydata.mobileNumber,
        };

        //console.log("Cdataaaaa", cdata);

        User.updateProfileImage(cdata, (err, resdata) => {
          console.log("in the update profile image");
          if (err) {
            //console.log("error uplaoding", err);
            res.json(
              helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
            );
          } else {
            res.json(
              helper.showSuccessResponse(
                "PROFILE_IMAGE_CHANGED_SUCCESS",
                resdata
              )
            );
          }
        });
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  acknowledgeSocialRegistration: async (req, res) => {
    try {
      var data = req.body;
      var fbid = data.fbid || "";
      var gid = data.gid || "";
      var appleid = data.appleid || "";
      if (!fbid && !gid && !appleid) {
        return res.json(
          helper.showValidationErrorResponse("SOCIAL_ID_IS_REQUIRED")
        );
      }
      var query = {};
      if (fbid) query.fbid = fbid;
      if (gid) query.gid = gid;
      if (appleid) query.appleid = appleid;
      var userc = await User.findOne(query);
      //console.log("check data ", data, "check query ", query, "user data ", userc);

      if (userc != null) {
        var resData = helper.showSuccessResponse("USER_EXISTS", userc);
        resData.exist = true;
        res.json(resData);
      } else {
        var resData = helper.showSuccessResponse("NEW_USER", {});
        resData.exist = false;
        res.json(resData);
      }
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userLogin: async (req, res) => {
    try {
      var data = req.body;
      var mobileNumber = data.mobileNumber;
      var countryCode = data.countryCode;

      if (!mobileNumber) {
        return res.json(
          helper.showValidationErrorResponse("MOBILE_NUMBER_IS_REQUIRED")
        );
      }

      if (!countryCode) {
        return res.json(helper.showValidationErrorResponse("CC_IS_REQUIRED"));
      }

      var userc = await User.findOne({ mobileNumber: mobileNumber });
      if (userc != null) {
        //console.log("userc", userc);
        console.log(userc, "getting the user");
        // Giving the otp in the registred mobile
        if (userc.password == null) {
          var exptime = new Date();
          exptime.setHours(exptime.getHours() + 1);
          var OTP = otpVerification.generateOTP();
          console.log(OTP, "getting the otp");
          data.msg = constant.APP_NAME + " OTP: " + OTP;

          otpVerification.sendOtpSMSCallback(data, async (err, resdata) => {
            if (err) {
              return res.json(
                helper.showTwillioTwillioErrorResponse(err.message)
              );
            }

            data.OTP = OTP;
            data.OTPexp = exptime;
            data.token = jwt.sign(
              { email: userc.email, userId: userc._id },
              "secret",
              { expiresIn: "1h" }
            );
            var uOTP = await User.updateOTP(data);
            uOTP.OTP = data.OTP;
            uOTP.OTPexp = data.OTPexp;
            uOTP.token = data.token;
            uOTP.exist = true;
            uOTP.passwordStatus = false;
            res.json(helper.showSuccessResponse("OTP_SUCCESS", uOTP));
          });
        } else {
          var resData = helper.showSuccessResponse("USER_EXISTS", userc);
          console.log(resData, "getting the resData");
          resData.passwordStatus = true;
          resData.exist = true;
          res.json(resData);
        }
      } else {
        console.log("in that piece of code");
        var exptime = new Date();
        exptime.setHours(exptime.getHours() + 1);
        data.OTPexp = exptime;
        data.OTP = otpVerification.generateOTP();
        var sTemplate = await smsTemplate.findOne({
          title: "USER_REGISTER_OTP_VERIFICATION",
        });
        //console.log(sTemplate);
        data.msg = data.OTP;
        if (sTemplate == null || sTemplate == undefined) {
          data.msg = constant.APP_NAME + " OTP: " + data.OTP;
        } else {
          data.msg = sTemplate.body.replace("XXXXXX", data.OTP);
        }

        otpVerification.sendOtpSMSCallback(data, (err, resdata) => {
          if (err) {
            return res.json(helper.showTwillioErrorResponse(err.message));
          }

          tempUser.updateTempUser(data, (err, user) => {
            if (err) {
              res.json(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              var resData = helper.showSuccessResponse("NEW_USER", data);
              resData.exist = false;
              res.json(resData);
            }
          });
        });
      }
    } catch (err) {
      console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userPassword: async (req, res) => {
    try {
      var data = req.body;

      //console.log('Login Data', data);

      var paramsList = [
        { name: "mobileNumber", type: "string" },
        { name: "password", type: "string" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var mobileNumber = data.mobileNumber;
          var password = data.password;

          if (!password) {
            return res.json(
              helper.showValidationErrorResponse("PASSWORD_IS_REQUIRED")
            );
          }

          var userc = await User.findOne({ mobileNumber: mobileNumber });

          try {
            var hashedPassword = require("crypto")
              .createHash("sha256")
              .update(data.password)
              .digest("hex");
            console.log(hashedPassword, "crypto");
          } catch (err) {
            //console.log('crypto support is disabled!');
          }

          if (userc == null) {
            return res.json(
              helper.showUnathorizedErrorResponse("INVALID_LOGIN_CREDENTIALS")
            );
          }

          var isBlocked = await User.findOne({
            mobileNumber: mobileNumber,
            isBlocked: true,
          });
          if (isBlocked !== null) {
            return res.json(
              helper.showValidationErrorResponse(
                "Your account is blocked by admin!"
              )
            );
          }
          if (!data.firebaseToken) {
            return res.json(
              helper.showValidationErrorResponse("FIREBASE_TOKEN_IS_REQUIRED")
            );
          }

          userc.firebaseToken = data.firebaseToken;

          if (userc != null && hashedPassword === userc.password) {
            userc.token = jwt.sign(
              {
                email: userc.email,
                userId: userc._id,
              },
              "secret",
              {
                expiresIn: "2h",
              }
            );

            var mytoken = await User.updateToken(userc);

            res.json(helper.showSuccessResponse("LOGIN_SUCCESS", mytoken));
          } else {
            res.json(
              helper.showUnathorizedErrorResponse("INVALID_LOGIN_CREDENTIALS")
            );
          }
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userForgotPassword: async (req, res) => {
    try {
      var data = req.body;

      var mobileNumber = data.mobileNumber;
      var countryCode = data.countryCode;
      if (!mobileNumber) {
        return res.json(
          helper.showValidationErrorResponse("MOBILE_NUMBER_IS_REQUIRED")
        );
      }

      if (!countryCode) {
        return res.json(helper.showValidationErrorResponse("CC_IS_REQUIRED"));
      }

      var userc = await User.findOne({ mobileNumber: data.mobileNumber });
      if (userc) {
        var exptime = new Date();
        exptime.setHours(exptime.getHours() + 1);
        var OTP = otpVerification.generateOTP();
        var sTemplate = await smsTemplate.findOne({
          title: "USER_OTP_FORGOT_PASSWORD",
        });
        //console.log(sTemplate);
        data.msg = OTP;
        if (sTemplate == null || sTemplate == undefined) {
          data.msg = OTP;
        } else {
          data.msg = sTemplate.body.replace("XXXXXX", OTP);
        }

        otpVerification.sendOtpSMSCallback(data, async (err, resdata) => {
          if (err) {
            return res.json(helper.showTwillioErrorResponse(err.message));
          }

          data.OTP = OTP;
          data.OTPexp = exptime;
          data.token = jwt.sign(
            { email: userc.email, userId: userc._id },
            "secret",
            { expiresIn: "2h" }
          );
          var uOTP = await User.updateOTP(data);
          uOTP.OTP = data.OTP;
          uOTP.OTPexp = data.OTPexp;
          uOTP.token = data.token;
          res.json(helper.showSuccessResponse("OTP_SUCCESS", uOTP));
        });
      } else {
        return res.json(helper.showValidationErrorResponse("MOB_NO_NOT_EXIST"));
      }
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userResetPassword: async (req, res) => {
    try {
      var data = req.body;
      data.mobileNumber = data.mobileNumber;

      if (!data.password) {
        return res.json(
          helper.showValidationErrorResponse("PASSWORD_IS_REQUIRED")
        );
      }

      if (!data.confirmPassword) {
        return res.json(
          helper.showValidationErrorResponse("CNF_PASSWORD_IS_REQUIRED")
        );
      }

      if (data.password != data.confirmPassword) {
        return res.json(
          helper.showValidationErrorResponse("PASSWORD_CNFPASSWORD_NOT_MATCH")
        );
      }
      var passmain = data.password;
      var userc = await User.findOne({
        mobileNumber: data.mobileNumber,
        OTP: data.OTP,
      });
      //console.log("data.mobileNumber   ", data, "userc   ", userc);
      if (userc != null) {
        var cDate = new Date();
        var exptime = new Date(userc.OTPexp);
        if (cDate.getTime() >= exptime.getTime()) {
          return res.json(helper.showValidationErrorResponse("OTP_EXPIRED"));
        }

        if (userc.OTP == data.OTP) {
          data.password = require("crypto")
            .createHash("sha256")
            .update(data.password)
            .digest("hex");
          var upass = await User.updatePassword(data);

          var mTemplate = await MailTemplate.findOne({
            title: "USER_RESET_PASSWORD",
          });
          //console.log(mTemplate);

          if (mTemplate == null || mTemplate == undefined) {
            var msg = __("PASSWORD_RESET_MSG", passmain);
            var sub = __("%s Reset Password", constant.APP_NAME);
            var senemail = await mailgunSendEmail.sendEmail(
              upass.email,
              sub,
              msg
            );
          } else {
            var msg = mTemplate.body.replace("XXXXXX", passmain);
            var senemail = await mailgunSendEmail.sendEmail(
              upass.email,
              mTemplate.emailTitle,
              msg
            );
            //console.log(senemail);
          }

          res.json(helper.showSuccessResponse("PASSWORD_RESET_SUCCESS", {}));
        } else {
          return res.json(helper.showValidationErrorResponse("OTP_NOT_MATCH"));
        }
      } else {
        return res.json(
          helper.showValidationErrorResponse("MOB_NO_NOT_EXIST_OR_OTP_INVALID")
        );
      }
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  resendOTP: async (req, res) => {
    try {
      var data = req.body;
      var mobileNumber = data.mobileNumber;
      var countryCode = data.countryCode;

      if (!mobileNumber) {
        return res.json(
          helper.showValidationErrorResponse("MOBILE_NUMBER_IS_REQUIRED")
        );
      }

      if (!countryCode) {
        return res.json(helper.showValidationErrorResponse("CC_IS_REQUIRED"));
      }

      var exptime = new Date();
      exptime.setHours(exptime.getHours() + 1);
      data.OTPexp = exptime;
      data.OTP = otpVerification.generateOTP();
      var sTemplate = await smsTemplate.findOne({
        title: "USER_RESEND_OTP_VERIFICATION",
      });
      //console.log(sTemplate);
      data.msg = data.OTP;
      if (sTemplate == null || sTemplate == undefined) {
        data.msg = data.OTP;
      } else {
        data.msg = sTemplate.body.replace("XXXXXX", data.OTP);
      }

      var userc = await User.findOne({ mobileNumber: data.mobileNumber });

      if (userc != null) {
        data.token = jwt.sign(
          { email: userc.email, userId: userc._id },
          "secret",
          { expiresIn: "2h" }
        );
        var uOTP = await User.updateOTP(data);
      }

      otpVerification.sendOtpSMSCallback(data, (err, resdata) => {
        if (err) {
          return res.json(helper.showTwillioErrorResponse(err.message));
        }

        tempUser.updateTempUser(data, (err, user) => {
          if (err) {
            res.json(
              helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
            );
          } else {
            res.json(helper.showSuccessResponse("OTP_SUCCESS", data));
          }
        });
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getUserProfileById: async (req, res) => {
    try {
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      User.getUserById(verifydata._id, (err, user) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (user == null) {
            return res.json(
              helper.showValidationErrorResponse("NO_DATA_FOUND")
            );
          }

          res.json(helper.showSuccessResponse("DATA_SUCCESS", user));
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userAddContact: async (req, res) => {
    try {
      var data = req.body;

      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      if (!data.name) {
        return res.json(helper.showValidationErrorResponse("NAME_IS_REQUIRED"));
      }

      if (!data.contactNumber) {
        return res.json(
          helper.showValidationErrorResponse("CONTACT_NUMBER_IS_REQUIRED")
        );
      }

      if (!data.countryCode || data.countryCode == undefined) {
        data.countryCode = verifydata.countryCode;
        console.log(verifydata.countryCode, "getting the country code ");
      }

      var contactData = {
        userId: verifydata._id,
        name: data.name,
        contactNumber: data.contactNumber,
        countryCode: data.countryCode,
      };
      var check = await Contact.searchForContact(contactData);
      if (check == null) {
        if (check.length != 0)
          return res.json(
            helper.showValidationErrorResponse("CONTACT_NUMBER_EXISTS")
          );
      }

      Contact.addContact(contactData, (err, contact) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          res.json(helper.showSuccessResponse("CONTACT_ADD_SUCCESS", contact));
        }
      });
    } catch (e) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  removeUserContact: async (req, res) => {
    try {
      var data = req.body;
      var id = data.contactId;
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      Contact.removeContact(id, (err, contact) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          res.json(
            helper.showSuccessResponse("CONTACT_REMOVE_SUCCESS", contact)
          );
        }
      });
    } catch (e) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getUserContacts: async (req, res) => {
    try {
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Contact.getContactByUserIdCallback(verifydata._id, (err, contacts) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (contacts.length === 0) {
            return res.json(
              helper.showValidationErrorResponse("NO_DATA_FOUND")
            );
          }

          res.json(helper.showSuccessResponse("DATA_SUCCESS", contacts));
        }
      });
    } catch {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userSendPanicSMS: async (req, res) => {
    try {
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      var data = req.body;

      console.log("Panic data", data);

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      var trip = await Trips.getTripsByIdPanic(data.tripId);
      console.log("Trip data", trip);
      var cardetail = await Car.getCarsByIdAsync(trip.driverSelectedCar);
      console.log("Car detail", cardetail);

      var message =
        "your Friend " +
        trip.customerName +
        " is feeling unsafe on trip with" +
        trip.driverName +
        " Details of Driver:" +
        "\nContact Number :" +
        trip.driverNumber +
        "\n Driver Email :" +
        trip.driveremail +
        "\n Car Model :" +
        cardetail.carName +
        "\n Car Type :" +
        cardetail.carType +
        "\n Car Reg. No.:" +
        cardetail.plateNumber;
      var contacts = await Contact.getContactByUserId(verifydata._id);

      //console.log("PaNIC Contacts Data", contacts);

      if (contacts != null && contacts.length > 0) {
        contacts.forEach((element) => {
          if (element.countryCode == null || element.countryCode == undefined) {
            element.countryCode = verifydata.countryCode;
          }
          //console.log("element", element);
          otpVerification.sendpanicSMS(
            element.contactNumber,
            element.countryCode,
            message
          );
        });

        res.json(helper.showSuccessResponse("SMS_SEND_SUCCESS", {}));
      } else {
        return res.json(helper.showValidationErrorResponse("NO_DATA_FOUND"));
      }
    } catch (err) {
      console.log("Error", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  userEverything: async (req, res) => {
    try {
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      let [
        Offer,
        selecte_payment,
        getUpcomigBooking,
        getPastBooking,
        paymentMethods,
        PaymentList,
        eContacts,
      ] = await Promise.all([
        promos.getAllPromoCodesVisible1(),
        POs.getUserSelectedPO(verifydata._id),
        Trips.getCustomerUpcomingTripsAsync({ customerId: verifydata._id }),
        Trips.getCustomerPastTripsASync({ customerId: verifydata._id }),
        PMs.getPMsVisible(),
        POs.getPObyCustomerIdAsync({ customerId: verifydata._id }),
        Contact.getContactByUserId(verifydata._id),
      ]);

      var resdata = {
        promos: Offer,
        selectpayment: selecte_payment,
        upcomingBooking: getUpcomigBooking,
        pastBooking: getPastBooking,
        profileDetails: verifydata,
        paymentMethods: paymentMethods,
        userPaymentList: PaymentList,
        emergencyContacts: eContacts,
      };

      res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));

      if (
        verifydata.customerStatus === "On trip" ||
        verifydata.customerStatus === "Waiting for Driver"
      ) {
        //console.log("Customer is waiting for an trip!");
        var trip = await Trips.getUserTripForResume({
          customerId: verifydata._id,
        });

        var sendto = await socketCustomer.findCSocket(verifydata._id);
        var io = req.app.get("socketio");

        if (sendto != null && sendto.offline === "no") {
          //console.log("Customer is waiting for an trip socket hit!");
          io.to(sendto.socketId).emit("trip_customer_socket", trip[0]);
        }
      }
    } catch (error) {
      //console.log(error);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  updateUserStatus: async (req, res) => {
    var us = await User.updateCustomerStatusd({
      customerNumber: req.params._id,
    });
    res.json({ status: "success", data: us });
  },

  getUserChatHistory: async (req, res) => {
    try {
      var verifydata = await authroute.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      var data = req.body;
      if (!data.driverId) {
        return res.json(
          helper.showValidationErrorResponse("DRIVER_ID_REQUIRED")
        );
      }
      var userChat = await Chat.getUserChat({
        customerId: verifydata._id,
        driverId: data.driverId,
      });
      if (userChat == null) {
        return res.json(helper.showValidationErrorResponse("NO_MESSAGE_FOUND"));
      } else {
        ChatHistory.getChatHistory({ chatId: userChat._id }, (err, resdata) => {
          if (err) {
            return res.json(
              helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
            );
          } else {
            return res.json(
              helper.showSuccessResponse("MESSAGE_LIST", resdata)
            );
          }
        });
      }
    } catch (error) {
      console.log();
      return res
        .status(500)
        .json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },
};
