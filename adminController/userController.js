var userModel = require('../models/userTable.js');
var Driver = require('../models/drivertable');
var jwt = require('jsonwebtoken');
var authroute = require('../middleware/auth.js');
const userHelper = require('../helper/user');
const env = require('../config/env')();
const ObjectId = require('objectid');
const POs = require('../models/paymentoptions');
var sendEmail = require('../lib/mailgunSendEmail');
const PMs = require('../models/listPMethods');

module.exports = {
   
    addAdmin: async (req, res) => {
        try{
         /* var verifydata = await authroute.validateAdmin(req.headers);
          if (verifydata == null) {
              return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
          }*/
          const { email, password, mobileNumber, name} = req.body;
          const role = req.body.role.toUpperCase();
          if (!email) return res.json({ status: 0, message: 'Email is required.' });
          if (!role) return res.json({ status: 0, message: 'Role is required.' });
          if (!name) return res.json({ status: 0, message: 'Name is required.' });
          if (!password) return res.json({ status: 0, message: 'Password is required.' });
          //if(!status) return res.json({ status: 0, message: 'Status is required.' });
          const newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
          userModel.update({ email: email }, { name: name, email: email, role: role, password: newPassword, mobileNumber: mobileNumber, customerStatus:"Active" }, { upsert: true }, function (err, data) {
            if (err) {
              return res.json({ status: 0, message: 'Error in role change query.', err: err });
            }
            else {
              return res.json({ status: 1, message: 'Successfuly updated.' })
            }
          });
        }catch(error){
          return res.json({ status: 0, message: 'Error in add admin', error:error});
        }
      },

      sendNotification : async(req,res) =>{
        try {
          const {title, message, userType} = req.body;
          if(!title) return res.json({status:0, message:'Title is required.'});
          if(!message) return res.json({status:0, message:'Message is required.'});
          if(!userType) return res.json({status:0, message:'userType is required.'});
        
        if(userType =="Customer"){
          userModel.find({},async(err,data)=>{
            if(err){
              return res.json({status:0, message:'Error in firebase token query.'});
            }
            else{
              var messages = [];
              if(data.length > 0){
                data.forEach((element) => {
                  element = JSON.parse(JSON.stringify(element));
                    if(element.firebaseToken){  
                            messages.push({
                              notification: {title: title, body: message},
                              token: element.firebaseToken,
                            });
                      }
                  });
              }
               if(messages.length > 0){
                   let result = helper.sendNotificationCustomer(messages);
                   return res.json({status:1, message:'Notification send successfully'})
                }else {
                   return res.json({status:1, message:'No firebase token available'})
                }
            }
          });
           
        } else if(userType =="Driver") {
            Driver.find({},async (err,data)=>{
                if(err){
                  return res.json({status:0, message:'Error in firebase token query.'});
                }
                else{
                  var messages = [];
                  if(data.length > 0){
                    data.forEach((element) => {
                      element = JSON.parse(JSON.stringify(element));
                        if(element.firebaseToken){  
                                messages.push({
                                  notification: {title: title, body: message},
                                  token: element.firebaseToken,
                                });
                          }
                      });
                  }
                   if(messages.length > 0){
                       let result = await helper.sendNotificationDriver(messages);
                       return res.json({status:1, message:'Notification send successfully'})
                    }else {
                       return res.json({status:1, message:'No firebase token available'})
                    }
                }
              });
           }else{

            userModel.find({}, async(err,data)=>{
              if(err){
                return res.json({status:0, message:'Error in firebase token query.'});
              }
              else{
                var messages = [];
                if(data.length > 0){
                  data.forEach((element) => {
                    element = JSON.parse(JSON.stringify(element));
                      if(element.firebaseToken){  
                              messages.push({
                                notification: {title: title, body: message},
                                token: element.firebaseToken,
                              });
                        }
                    });
                }
                 if(messages.length > 0){
                     let result = await helper.sendNotificationCustomer(messages);
                     Driver.find({},function(err,resdata){
                      if(err){
                        return res.json({status:0, message:'Error in firebase token query.'});
                      }
                      else{
                        var messages = [];
                        if(resdata.length > 0){
                          resdata.forEach((element) => {
                            element = JSON.parse(JSON.stringify(element));
                              if(element.firebaseToken){  
                                  messages.push({
                                    notification: {title: title, body: message},
                                    token: element.firebaseToken,
                                  });
                                }
                            });
                        }
                         if(messages.length > 0){
                             let result = helper.sendNotificationDriver(messages);
                             return res.json({status:1, message:"Notification sent successfully"})
                          }else{
                              return res.json({status:1, message:"Notification sent successfully"})
                          }
                      }
                    });
                  }
              }
            });
           }
        } catch (error) {
          //console.log("error",error);
          return res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
      },
    
      getAllAdminList: async (req, res) => {
        try{
          var verifydata = await authroute.validateAdmin(req.headers);
          if (verifydata == null) {
              return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
          }
          userModel.find({ $or: [{ role: "ADMIN" }, { role: "SUBADMIN" }] }, function (err, data) {
            if (err) return res.json({ status: 0, message: 'Error in admin find query' });
            else {
              return res.json({ status: 1, data: data });
            }
          });
        }catch(error){
          return res.json({ status: 0, message: 'Error in get all admin list', error:error});
        }
      },
    
    
      editAdmin: async (req, res) => {
            try{
              var verifydata = await authroute.validateAdmin(req.headers);
              if (verifydata == null) {
                  return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
              }
              const { userId, role, email, password, name, status,mobileNumber } = req.body;
              if (!ObjectId.isValid(userId)) return res.json({ status: 0, message: 'User ID is not valid.' });
              let obj = {};
              if (name) obj.name = name;
              if (role) obj.role = role.toUpperCase();
              if (email) obj.email = email;
              if(status) obj.status = status;
              if(mobileNumber) obj.mobileNumber = mobileNumber;
              if (password) {
                  const newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
                  obj.password = newPassword;
              }
              userModel.findOneAndUpdate({ _id: ObjectId(userId) }, { $set: obj }, { new: true }, function (err, data) {
                  if (err) return res.json({ status: 0, message: 'Error in admin update query.' });
                  else {
                  return res.json({ status: 1, message: 'Successfuly updated.', data: data });
                  }
              });
            }catch(error){
            return res.json({ status: 0, message: 'Error in edit admin', error:error});
            }
      },

      adminLogin: async(req,res) => {
        try{
          let data = req.body;
          if(!data.email){
              return res.status(200).json({ "status": "failure", "message": "Email is required!" });
          }
          if(!data.password){
              return res.status(200).json({ "status": "failure", "message": "Password is required!" });
          }
          data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
          userModel.adminLogin(data,async (err,resdata)=>{
                if(resdata.length>0){
                  let token = jwt.sign({ email: resdata[0].email, mobileNumber: resdata[0].mobileNumber }, 'secret', { expiresIn: "2h" });
                  userModel.updateAdminToken(resdata[0].email,token,async (err,userdata)=>{
                      return res.status(200).json({ "status": "success", "message": "Login successful!", data:userdata});
                  });
                }else{
                  return res.status(200).json({ "status": "failure", "message": "Wrong username or password" });
                }
          })
        }catch(error){
            res.status(200).json({"message":"Internal server Error","data":{}, "error": error})
        }
      },

      getUserById: async(req,res) => {
           try{
              var verifydata = await authroute.validateAdmin(req.headers);
              if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
              }
              let userId = req.params.userId;
              userModel.getUserById(userId,(err,data)=>{
                 if(err){
                     return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                 }else{
                     return res.json(helper.showSuccessResponse('USER_DATA', data));
                 }
              })
           }catch(error){
               return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
           }
      },

      getUserWithFilter: async(req,res) => {
        try {
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            const data = req.body;
            const pageSize       = data.limit  || 10;
            const sortByField    = data.orderBy || "createdAt";
            const sortOrder      = data.order   || -1;
            const paged          = data.page || 1;
            let obj={};
            if(data.fieldName && data.fieldValue) obj[data.fieldName]={ $regex : data.fieldValue || '', $options : 'i'};
            if(data.startDate) obj.createdAt =  { $gte : new Date(data.startDate) };
            if(data.endDate) obj.createdAt =  { $lte : new Date(data.endDate) };
            if(data.filter){
                   obj['$and'] = [];
                   obj['$and'].push({name: { $regex : data.filter || '', $options : 'i'}})
            }
             let count = await userModel.aggregate([{$match:{role:{$ne :"ADMIN"}}},{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
             let totalcount = count.length>0?count[0].count:0;
             userModel.getUsersWithFilter(obj,sortByField,sortOrder,paged,pageSize,(err,data)=>{
                if(err){
                     return res.status(200).json({ "message": "Error in user query", data: {}, "error": err });   
                }else{
                     return res.status(200).json({ "message": "All User", totalcount:totalcount , data: data, "error": {} });   
                }
             })
         }catch(err){
             //console.log(err);
            res.status(500).json({"message":"Internal server Error","error": err})
         }
     },

     addUser: async(req,res) => {
      try{
          var verifydata = await authroute.validateAdmin(req.headers);
          if (verifydata == null) {
              return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
          }
          var data = req.body;
          if(!data.role){
            return res.status(200).json({"message":"Role is required!"});
          }
          if(!data.name){
              return res.status(200).json({"message":"Name is required!"});
          };
          if(!data.email){
              return res.status(200).json({"message":"Email is required!"});
          };
          if(!data.countryCode) {
              return res.status(200).json({"message":"Country code is required!"});
          }
          if(!data.mobileNumber){
              return res.status(200).json({"message":"Phone Number is required!"});
          }
          if(!data.address){
            return res.status(200).json({"message":"Address is required!"});
          }
          if(!data.password){
              return res.status(200).json({"message":"Password required!"});
          };
          var userc =  await userModel.findOne({mobileNumber:data.mobileNumber});
          if(userc != null){
              return res.status(200).json({"status":"failure","message":"User with this phone number already exists!", "data":{}});
          }else{
              var hashedPassword = require('crypto').createHash('sha256').update(data.password).digest('hex');
              var userd = {
                  name : data.name,
                  email : data.email,
                  mobileNumber : data.mobileNumber,
                  countryCode: data.countryCode,
                  password: hashedPassword,
                  role:data.role,
                  address:data.address,
                  token: jwt.sign(
                      {
                          email:data.email,
                          userId:data.mobileNumber
                      },
                      env.JWTOKEN,
                      {
                          expiresIn: "2h"
                      }
                  )
              }
  
              userModel.addUser(userd, (err, user) => {
                  if(err){
                      res.status(200).json({"status":"failure","message":"User not created","data":{},"error": err});
                  } else{ 
                       module.exports.addCashPayment(user._id);
                      sendEmail.sendEmail(data.email,  `Welcome to elite`, `Your Elite account has been successfully created by the admin email:${data.email} password:${data.password}`);
                      res.status(200).json({"status":"success","message":"User registered successfully!", "data": user});
                  }
              });
  
          }
      }
      catch(err){
        //console.log(err);
          res.status(500).json({"status":"failure","message":"Internal Server Error","data":{},"error": err});
      }
   },
   addCashPayment: async (customerId) => {
      try {
          var pmcash = await PMs.getPMsByType({ type: "Cash" });
      } catch (err) {
      }
      var Cash = {
          "customerId": customerId,
          "type": "Cash",
          "name": "Cash",
          "lasd": "Cash",
          "token": null,
          "detials": "Cash Payment Method",
          "logo":""
      }

      Cash.logo = pmcash.logo;
      POs.addPaymentOptions(Cash, (err, resdata) => { });
   },

   editUser: async(req,res) => {
     try{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
            return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
        }
        const {userId,name,mobileNumber,email,password,address} =req.body;
        let files=req.files;
        if(!userId) return res.json({status:0, message:'userId is reuired.'});
        if(!ObjectId.isValid(userId))  return res.json({status:0, message:'UserId is not valid.'});
        let obj={};
        if(name) obj.name = name;
        if(email) obj.email = email;
        if(mobileNumber) obj.mobileNumber = mobileNumber;
        if(address) obj.address =  address;
        if(password){
            let newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
            obj.password = newPassword;
        }
        obj.updatedAt=new Date();
        if(files && Object.keys(files).length !== 0){
          userHelper.awsImagesSave(files, function(imageResult)  {
              if (imageResult.status == 0) {
                return res.json({status: 0, message: 'Error in Image Path.'});
              }
              else{
                obj.profileImage=imageResult.data;
                userModel.findOneAndUpdate({_id:userId},obj,{new:true},function(err,data){
                  if(err){
                    //console.log("Error",err);
                    return res.json({status:0, message:'Error in update query'});
                  }
                  else{
                    return res.json({status:1, data:data, message:'Successfuly updated.'});
                  }
                });
              }
            })
        }else{
          userModel.findOneAndUpdate({_id:userId},obj,{new:true},function(err,data){
            if(err){
              return res.json({status:0, message:'Error in update query'});
            }
            else{
              return res.json({status:1, data:data, message:'Successfuly updated.'});
            }
          });
        }
     }catch(error){
         //console.log(error);
         return res.json({status:0, message:'Error in update query'});
     } 
   },

   removeUser: async(req,res) => {
       try{
            var verifydata = await authroute.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ "message": "Not Authorized!", "data": {}, "error": {} });
            }
            userModel.remove({ _id: req.body.id }, function(err) {
                if (!err) {
                    return res.json({message:'Successfuly deleted.'});
                }
                else {
                    return res.json({status:0, message:'Error in delete query'});
                }
            });
       }catch(error){
            return res.json({status:0, message:'Error in remove query'});
       }
   },

   blockUnBlockCustomer: async(req,res) => {
      var verifydata = await authroute.validateAdmin(req.headers);
      if(verifydata == null){
            return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
      }
      const {customerId,isBlock} =req.body;
      if(!ObjectId.isValid(customerId)) return res.json({status:0, message:'Customer id is not valid'});
      userModel.findOneAndUpdate({_id:ObjectId(customerId)},{$set:{isBlocked:isBlock}},{new:true},function(err,data){
        if(err){
          return res.json({status:0, message:'Error in status change query.'});
        } 
        else{
          return res.json({status:1, message:'Successfuly updated.', data:data});
        }
      });
  }
}