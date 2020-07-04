var multer = require('multer');
var multerS3 = require('multer-s3');
var aws = require('aws-sdk');
//var config = require('../config.js');
const imgPath = require('path');
const fs = require('fs')
const env = require('../config/env')();
const algorithm = 'aes-256-ctr';
const crypto = require('crypto');
//const fcm = require('fcm-push');



aws.config.update({
    // Your SECRET ACCESS KEY from AWS should go here,
    secretAccessKey: env.S3BUCKET.SECRET_ACCESS_KEY,
    // Not working key, Your ACCESS KEY ID from AWS should go here,
    accessKeyId: env.S3BUCKET.SECRET_ACCESS_ID,
    region: env.S3BUCKET.REGION_NAME // region of your bucket
});

var s3 = new aws.S3();

function encrypt(text) {
  const cipher = crypto.createCipher(algorithm, secretKey);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipher(algorithm, secretKey);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}
const emailValidator = (email) => {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
};




module.exports = {

  generateHashPassword : async (password) => {
  const hash = await encrypt(password);
  return hash;
},

comparePassword :  (login_password,orignal_password) => {
  const decryptedPassword = decrypt(orignal_password);
  return login_password == decryptedPassword;
},
  emailValidate : (email) => {
    return emailValidator(email);
  },
  awsImagesSave:async(files,cb)=>{
   if(files.files ){
      var pathFile=imgPath.extname(files.files.name).toLowerCase();
      fs.readFile(files.files.path, function (err, data) {
          if (err) { throw err; }
          var base64data = new Buffer(data, 'binary');
          var awsdata;
          var params = {
              Bucket: env.S3BUCKET.BUCKET_NAME,
              Key: Date.now().toString()+files.files.name,
              Body: base64data,
               ACL: 'public-read'
              };
          s3.upload(params, function (err, awsData) {
            if (err) {
              return cb({status:0,messages:'Error in uploading image.'});
               //console.log(err);
            }
            return cb({status: 1, data:awsData.Location,imageType:pathFile,ImageName:files.name});
          });
       });
     }
    else{
      return cb({error:400, status:0,messages:'profile pic and Id are required.'});
    }
  },

  awsImages:async(files,cb)=>{
    let fileName ;
    if(files.image) fileName = files.image;
    if(files.docs) fileName = files.docs;
   if(files.image  || files.docs){
    var pathFile=imgPath.extname(fileName.name).toLowerCase();
    fs.readFile(fileName.path, function (err, data) {
        if (err) { throw err; }
        var base64data = new Buffer(data, 'binary');
        var awsdata;
        var params = {
            Bucket: env.S3BUCKET.BUCKET_NAME,
            Key: Date.now().toString()+fileName.name,
            Body: base64data,
             ACL: 'public-read'
            };
        s3.upload(params, function (err, awsData) {
          //console.log("==========s3.upload  =====");
        if (err) {
          //console.log("=================images====");
          return cb({status:0,messages:'Error in uploading image.'});
           //console.log(err);
        }
        return cb({status: 1, data:awsData.Location,imageType:pathFile,ImageName:fileName.name});
      });
     });
  }
  else{
    return cb({error:400, status:0,messages:'profile pic and Id are required.'});
  }

},

// firebaseMessages : async(tokens,title,body,cb) =>{
//
// //var Tokens = [ 'token1 here', '....', 'token n here'];
//
//   var message = {
//
//     notification:{
//       title : title,
//       body : body
//     }
//   };
//   FCM.sendToMultipleToken(message, tokens, function(err, msgData) {
//       if(err){
//           return cb({error:400, status:0,messages:'Error in Push notification.'});
//       }else {
//           return cb({status:1,messages:'Successfuly sent.',msgData:msgData });
//       }
//
//   });
//
// }

firebaseMessages : async(userId,title,message,userType) =>{

          let messages = {
            to: userId, // required fill with device token or topics
            notification: {
                title: title,
                body: message
            },
            userType:userType
          }
        //console.log(userId,"=============ghjghj");
        sendFcm(messages,function(err,data){
          //console.log("results==================");
          //console.log(err,data);
        })
    },

};
