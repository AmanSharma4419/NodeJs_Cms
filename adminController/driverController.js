const driverModel = require('../models/drivertable');
const driverPaymentModel = require('../models/driverPayments');
//const driverAccountModel = require('../models/driverAccount');
const tripModel = require('../models/triptable');
const ObjectId = require('objectid')
const userHelper = require('../helper/user');
const async = require('async');
const _ = require('underscore');
const moment = require('moment');
var sendEmail = require('../lib/mailgunSendEmail');
var Auth = require('../middleware/auth.js');
var MailTemplate = require('../models/mailTemplate.js');

module.exports = {

        driversList : async (req,res) =>{
            try{
                var verifydata = await Auth.validateAdmin(req.headers);
                if(verifydata == null){
                    return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
                }
                const {orderBy, order, page, limit, fieldName, fieldValue} =req.body
                var pageSize       = limit  || 10;
                var sortByField    = orderBy || "createdAt";
                var sortOrder      = order   || -1;
                var paged          = page || 1;
                let obj={};
                if(fieldName && fieldValue) {
                    obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
                } 
                let count = await driverModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
                driverModel.getDrivers(pageSize,sortByField,sortOrder,paged,obj,(err, data) => {
                    if(err || data.length == 0){
                        return res.status(200).json({"status":"failure", "message":"No Drivers Found!","data":{},"error": err});
                    } else{ 
                        return res.status(200).json({"status":"success", "message":"Driver Data", "data":data, "totalcount":count[0]?count[0].count:0});
                    }
                });
            }catch(err){
                return res.status(200).json({"status":"failure","message":"Not able to register please try dagin","data":{}, "error": err})
            }
        },

       addDriver : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          console.log("Data", req.body);
          const {name,email,mobileNumber,gender,password,address,city,dl,plateNumber,carName,_id,carType,OTP,carColor,licenceNumber,licenceExpDate} = req.body;
          let files = req.files;
          if(!email) return res.json({status:0, message:'Email is required.'});
          if(!password) return res.json({status:0, message:'Paasword is required.'});
          if(!mobileNumber) return res.json({status:0, message:'Mobile no is required.'});
          if(!files) return res.json({status:0, message:'Driving licence is required.'});
          if(!plateNumber) return res.json({status:0, message:'Plate number is required.'});
          if(!carName) return res.json({status:0, message:'carName is required.'});
          if(!carType) return res.json({status:0, message:'carType is required.'});
          const newPassword = require('crypto').createHash('sha256').update(password).digest('hex');
          let emailInfo = await driverModel.find({email:email});
          if(emailInfo && emailInfo.length >0) return res.json({status:0, message:'Email already exists.'});
          let driverNew = {
            name:name,
            email:email,
            mobileNumber:mobileNumber,
            gender : gender,
            password : newPassword,
            address : address,
            city : city,
            dl : dl,
            OTP : OTP,
            createdAt : new Date(),
            status : 'registered',
            driverStatus : 'Offline',
            licenceExpDate: licenceExpDate,
            licenceNumber: licenceNumber,
            selectedCar:_id,
            selectedCarTypeId:_id
          };
          /*driverNew['selectedCar.plateNumber'] =plateNumber;
          driverNew['selectedCar.carType'] =carType;
          driverNew['selectedCar.carName'] =carName;
          driverNew['selectedCar.carName'] =carColor;
          driverNew['selectedCar._id'] = _id;*/

          if(files && Object.keys(files).length > 0){
                userHelper.awsImagesSave(files, function(imageResult){
                  if (imageResult.status == 0) {
                          return res.json({status: 0, message: 'Error in Image Path.'});
                    }
                    else{
                      driverNew.dl=imageResult.data;
                      if(files && files.image){
                        userHelper.awsImages(files, function(carImageResult)  {
                          if (carImageResult.status == 0) {
                              return res.json({status: 0, message: 'Error in Image Path.'});
                          }
                          else{
                            driverNew['selectedCar.carImage'] =carImageResult.data;
                            var query = {email: data.email};

                            driverModel.findOneAndUpdate(query, driverNew, {upsert: true,fields : { password:0}, new:true},function(err,data){
                              if(err){
                                return res.json({status:0, message:'Error in driver save query ',err:err});
                              }
                              else{
                                return res.json({status:1, data:data, message:'Successfuly saved.'});
                              }
                            });
                          }
                      });
                    }else{
                        //console.log("driverNew   driverNew");
                        var query = {email: driverNew.email};
                        driverModel.findOneAndUpdate(query, driverNew, {upsert: true,fields : { password:0}, new:true},function(err,data){
                          if(err){ //console.log("cerrror ", err);
                            return res.json({status:0, message:'Error in driver save query 1', err:err});
                          }
                          else{
                            //console.log("datadata ", data)
                            return res.json({status:1, data:data, message:'Successfuly saved.'});
                          }
                        });
                      }
                  }
                })
              }
          else{
            return res.json({status:0, message:'Car image is required.'})
          }
       },

       getDriverById: async(req,res)=>{
        try{
            var verifydata = await Auth.validateAdmin(req.headers);
            if(verifydata == null){
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            let driverId = req.params.driverId;
            driverModel.getDriverById(driverId,(err,data)=>{
                if(err){
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('DRIVER_DATA', data));
                }
            })
        }catch(err){
          //console.log("Error", err);
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    removeDriver: async(req,res)=>{
      try{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
          }
          var driverId = req.params.driverId;
          if(!driverId){
              return res.json(helper.showValidationErrorResponse('DRIVER_ID_REQUIRED')); 
          }
          Driver.removeDriver(driverId,(err,data)=>{
              if(err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              }
              return res.json(helper.showSuccessResponse('DRIVER_DELETED', data));
          })
      }catch(err){
          return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
    },

    getDriverList: async(req,res)=>{
      try{
         var verifydata = await Auth.validateAdmin(req.headers);
         if(verifydata == null){
             return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
         }
         const {orderBy, order, page, limit, fieldName, fieldValue} =req.body
         var pageSize       = limit  || 10;
         var sortByField    = orderBy || "createdAt";
         var sortOrder      = order   || -1;
         var paged          = page || 1;
         let obj={};
         if(fieldName && fieldValue) {
             obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
         } 
         let count = await driverModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
         driverModel.getDrivers(pageSize,sortByField,sortOrder,paged,obj,(err, data) => {
             if(err){
                 return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
             } else{ 
                 let datacount = count.length>0?count[0].count:0;
                 return res.json(helper.showSuccessResponseCount('DRIVER_DATA', data, datacount));
             }
         });
      }catch(err){
        //console.log("Error",err);
         return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
   },

   editDriver: async(req,res)=>{
    try{
        var data = req.body;
        var verifydata = await Auth.validateAdmin(req.headers)  
        if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        if(!data.driverId){
          return res.json(helper.showValidationErrorResponse('DRIVER_ID_IS_REQUIRED'));
        }
        if (!data.name) {
          return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
        }
        data.email = data.email.trim().toLowerCase();
        if(!data.email){
            return res.json(helper.showValidationErrorResponse('EMAIL_REQUIRED'));
        }
        if(!data.mobileNumber){
            return res.json(helper.showValidationErrorResponse('MOBILE_NUMBER_REQUIRED'));  
        }
        if(!data.address){
            return res.json(helper.showValidationErrorResponse('ADDRESS_REQUIRED')); 
        }
        if(data.password){
            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
        }

        driverModel.editDriver(data,async (err, datad) => {
            if(err){
                //console.log("Error", err);
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            } else { 
                return res.json(helper.showSuccessResponse('DRIVER_UPDATED', datad));
            }
        });
    }catch(error){
      //console.log("Error", error);
        return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
},

    editDriverProfile : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const {driverId,name,email,mobileNumber,gender,password,address,city,dl,plateNumber,carName,_id,carType,UpdatedAt,status} = req.body;
          let files = req.files;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver id is not valid.'});
          let obj = {};
          if(name)  obj.name = name;
          if(mobileNumber) obj.mobileNumber = mobileNumber;
          if(email) obj.email = email ;
          if(gender) obj.gender = gender;
          if(password){
            obj.password = await userHelper.generateHashPassword(password);
          }
          if(address) obj.address = address;
          if(city) obj.city = city;
          if(dl) obj.dl = dl;
          if(plateNumber) obj['selectedCar.plateNumber'] = plateNumber;
          if(carName) obj['selectedCar.carName'] = carName ;
          if(_id) obj['selectedCar._id'] = _id;
          if(carType) obj['selectedCar.carType'] = carType;
          if(UpdatedAt) obj.UpdatedAt = new Date();
          if(status) obj.status = status;

          async.waterfall([
            function(callback){
              if(files && Object.keys(files).length > 0 && files.profileImage){
                userHelper.awsImagesSave(files, function(imageResult)  {
                  if (imageResult.status == 0) {
                        return res.json({status: 0, message: 'Error in Image Path.'});
                  }
                  else{
                    obj.profileImage=imageResult.data;
                    callback(null,[]);
                  }
              });
            }
              else{
                callback(null,[]);
              }
            },
            function(data,callback){
              if(files && Object.keys(files).length > 0 && files.image){
                userHelper.awsImages(files, function(imageResult)  {
                  if (imageResult.status == 0) {
                        return res.json({status: 0, message: 'Error in Image Path.'});
                  }
                  else{
                    obj['selectedCar.carImage']=imageResult.data;
                    callback(null,[],[]);
                  }
              });
            }
              else{
                callback(null,[],[]);
              }
            },
            function(data,callback){
              if(files && Object.keys(files).length > 0 && files.docs){
                userHelper.awsImages(files, function(imageResult)  {
                  if (imageResult.status == 0) {
                        return res.json({status: 0, message: 'Error in Image Path.'});
                  }
                  else{
                    obj['docs']=imageResult.data;
                    callback(null,[],[],[]);
                  }
              });
            }
              else{
                callback(null,[],[],[]);
              }
            },
            function(data,carData,docData,callback){
              driverModel.findOneAndUpdate({_id:ObjectId(driverId)},{$set:obj},{new:true},function(err,updateData){
                if(err){
                  return res.json({status:0, message:'Error in driver update query.', err:err});
                }
                else{
                  callback(null,updateData)
                }
              });
            },
          ],function(err,updateData){
            if(err) return res.json({status:0, message:'Error in driver update query.'});
            else{
              return res.json({"message":"Driver updpated succesfully",status:1, data:updateData});
            }
          });
        },

        driversBolckedList : async (req,res) =>{
            var verifydata = await Auth.validateAdmin(req.headers);
            if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
            }
            
            const {orderBy, order, page, limit, fieldName, fieldValue, startDate,endDate} =req.body
            var pageSize       = limit  || 10;
            var sortByField    = orderBy || "createdAt";
            var sortOrder      = order   || -1;
            var paged          = page || 1;
            let obj={};
            if(fieldName && fieldValue) {
                obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
            }
            if(startDate) obj.createdAt =  { $gte : new Date(startDate) };
            if(endDate) obj.createdAt   =  { $lte : new Date(endDate) };
            obj.status = 'rejected';
            let count = await driverModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
            driverModel.aggregate([
                {$match:obj},
                {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
                {$limit: parseInt(pageSize)}
            ],function(err,data){
                if(err){
                  return res.json({status:0, message:'Error in driver block list query.'})
                }
                else{
                  return res.json({"status":"success", "message":"Driver Data", "data":data, "totalcount":count[0]?count[0].count:0})
                }
              });
        },

        statusChange : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const {driverId,status} =req.body;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver id is not valid'});
          if(!status) return res.json({status:0, message:'Status is required'});
          driverModel.findOneAndUpdate({_id:ObjectId(driverId)},{$set:{status:status}},{new:true},function(err,data){
            if(err){
              return res.json({status:0, message:'Error in status change query.'});
            } 
            else{
              sendEmail.sendEmail(data.email,  `Elite account ${data.status}`, `Your ELite account has been ${data.status} by the admin`);
              return res.json({status:1, message:'Successfuly updated.', data:data});
            }
          });
        },

        blockUnBlockDriver: async(req,res) => {
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const {driverId,isBlock} =req.body;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver id is not valid'});
          //if(!isBlock) return res.json({status:0, message:'Block status is required'});
          driverModel.findOneAndUpdate({_id:ObjectId(driverId)},{$set:{isBlocked:isBlock}},{new:true},async (err,data)=>{
            if(err){
              return res.json({status:0, message:'Error in status change query.'});
            } 
            else{
              if(isBlock){
                var mTemplate = await MailTemplate.findOne({ title: 'ADMIN_BLOCK_DRIVER' });
                if(!mTemplate) {
                  sendEmail.sendEmail(data.email,  `Elite account ${data.status}`, `Your ELite account has been ${data.status} by the admin`);
                }else{
                  var msg = mTemplate.body
                  await mailgunSendEmail.sendEmail(data.email, mTemplate.emailTitle, msg);
                }
              }else{
                var mTemplate = await MailTemplate.findOne({ title: 'ADMIN_UNBLOCK_DRIVER' });
                if(!mTemplate) {
                  sendEmail.sendEmail(data.email,  `Elite account ${data.status}`, `Your ELite account has been ${data.status} by the admin`);
                }else{
                  var msg = mTemplate.body
                  await mailgunSendEmail.sendEmail(data.email, mTemplate.emailTitle, msg);
                }
              }
              //sendEmail.sendEmail(data.email,  `PEI taxi account ${data.status}`, `Your Peitaxi account has been ${data.status} by the admin`);
              return res.json({status:1, message:'Successfuly updated.', data:data});
            }
          });
        },

        driversOnlineList : async (req,res) =>{
            var verifydata = await Auth.validateAdmin(req.headers);
            if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
            }
            const {orderBy, order, page, limit, fieldName, fieldValue, startDate,endDate} =req.body
            var pageSize       = limit  || 10;
            var sortByField    = orderBy || "createdAt";
            var sortOrder      = order   || -1;
            var paged          = page || 1;
            let obj={};
            if(fieldName && fieldValue) {
                obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
            }
            if(startDate) obj.createdAt =  { $gte : new Date(startDate) };
            if(endDate) obj.createdAt =  { $lte : new Date(endDate) };
            obj.driverStatus = 'Online';
            let count = await driverModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
            driverModel.aggregate(
                [
                    {$match:obj},
                    {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
                    {$limit: parseInt(pageSize)}
                    
              ],function(err,data){
                  if(err){
                    return res.json({status:0, message:'Error in Driver Online list query.'})
                  }
                  else{
                    return res.json({"status":"success", "message":"Driver Online list", "data":data, "totalcount":count[0]?count[0].count:0})
                  }
              });
        },

        getDriverPaymentDetails : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
            return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const { driverId,startDate,endDate } = req.body;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver ID is not valid.'});
          if(!startDate) return res.json({status:0, message:'Start date is required'});
          if(!endDate) return res.json({status:0, message:'End date is required.'});
          if(new Date(startDate) > new Date(endDate)) return res.json({status:0, message:'Start date should not grater than End Date.'})

          driverModel.aggregate(
            [
              {
                $match:{_id:ObjectId(driverId)}
              },
              {
                  $lookup:
                    {
                      from: "trips",
                      localField: '_id',
                      foreignField: 'driverId',
                      as: "trips"
                    }
              },
              {$unwind:"$trips"},
              {
                $match:{
                    "trips.tripCreatedAt":{$gte : new Date(startDate) },
                    "trips.tripCreatedAt" : {$lte : new Date(endDate) },
                    "trips.tripStatus":'completed'
                  }
              },
            ],function(err,data){
              if(err) return res.json({status:0, message:'Error in trips details qurey.', err:err});
              else{
                if(data && data[0].trips){
                    let totalCash = 0,otherAmout = 0,driverEarn = 0, totalPromoAmount = 0, totalPendingAmount = 0 ;
                    for(let i in data){
                      if(data[i].trips.paymentMethod == 'cash') totalCash = totalCash + data[i].trips.cost
                      if(data[i].trips.paymentMethod != 'cash') otherAmout = otherAmout + data[i].trips.cost
                      totalPromoAmount = totalPromoAmount + data[i].trips.promoCodeCost;
                      totalPendingAmount = totalPendingAmount + data[i].trips.pendingBalance;

                        driverEarn = (totalCash + otherAmout + totalPromoAmount + totalPendingAmount) * 80/100;
                    };
                    data[0]['totalCash'] = totalCash;
                    data[0]['otherAmout'] = otherAmout;
                    data[0]['driverEarn'] = driverEarn;
                    data[0]['totalPromoAmount'] = totalPromoAmount;
                    data[0]['totalPendingAmount'] = totalPendingAmount;
                    return res.json({status:1, data:data});
                }else{
                  return res.json({status:1, data:data[0]});
                }
              }
            });
        },

        driverAccountDetails: async(req,res) =>{
              var verifydata = await Auth.validateAdmin(req.headers);
              if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
              }
              const {driverId} = req.body;
              if(!ObjectId.isValid(driverId) || !driverId) return res.json({status:0, message:'Driver Id is not valid'});
              driverAccountId = driverModel.find({driverId:driverId},'accountDetails', function(err,data){
                if(err) return res.json({status:0, message:'Error in driver payments find query', err:err});
                else{
                  return res.json({status:1, message:'Driver details fetched successfully! ', data: data})
                }
            });
          },


          driverPayments : async(req,res) =>{
            var verifydata = await Auth.validateAdmin(req.headers);
            if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
            }
            const {driverId,driver_pay_to_admin,admin_pay_to_driver,paymentType,transaction_id} = req.body;
            if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver Id is not valid'});
            if(!paymentType) return res.json({status:0, message:'PaymentType is required.'});
            let driverAccountId
            if(!driver_pay_to_admin && !admin_pay_to_driver) return res.json({status:0, message:'Payment To is required'});
            var driverData = await driverModel.find({_id:ObjectId(driverId)})
            if(admin_pay_to_driver){
            var driverBalance = driverData[0].overallPendingBalance;
            } else { //console.log("driverData[0].overallCashBalance   ", driverData);
              var driverBalance = driverData[0].overallCashBalance;
            }
            if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver id is not valid.'});
            let obj = {};
            if(driver_pay_to_admin >  obj.overallCashBalance){
              return res.json({status:0, message:'You can not pay more than the pending balance.'});
            }
            if(driver_pay_to_admin)  obj.overallCashBalance = driverBalance - driver_pay_to_admin;
            if(admin_pay_to_driver >  obj.overallPendingBalance){
              return res.json({status:0, message:'You can not pay more than the pending balance.'});
            }  
            if(admin_pay_to_driver)  obj.overallPendingBalance = driverBalance - admin_pay_to_driver;
            driverModel.update({_id: ObjectId(driverId)},{$set: obj },{new: true}, function(error , updateData){
                  if(error) return res.json({status:0, message:'Error in driver update query.'});
                  else {
                    return (null, updateData);
                  }
            });
            let paymentNew = {
                  driverId : driverId,
                  driver_pay_to_admin : driver_pay_to_admin,
                  admin_pay_to_driver : admin_pay_to_driver,
                  paymentType : paymentType,
            };
            if(paymentType == 'other'){
                  if(!transaction_id) return res.json({status:0, message:'Transaction ID is Required.'});
                  driverAccountId = await driverModel.find({_id:driverId});
                  if(driverAccountId && driverAccountId.length <= 0) return res.json({status:0, message:'Driver Account info should required.'});
                  paymentNew.driverAccountId = driverAccountId[0]._id;
            } else {
                  if(!transaction_id) return res.json({status:0, message:'Transaction ID is Required.'});
                  driverAccountId = await driverModel.find({_id:driverId});
                  if(driverAccountId && driverAccountId.length <= 0) return res.json({status:0, message:'Driver Account info should required.'});
                  paymentNew.driverAccountId = driverAccountId[0]._id;
            }
            if(transaction_id) paymentNew.transaction_id = transaction_id;
            driverPaymentModel.create(paymentNew,function(err,date){
              if(err) {/*console.log("check upodate onbjetc asdsafasfasfd", err);return res.json({status:0, message:'Error in driver payments save query', err:err});*/}
              else{
                return res.json({status:1, message:'Successfully saved.'})
              }
            });
          },

          getTripsByStatusUpdate: async (req,res) =>{
            var verifydata = await Auth.validateAdmin(req.headers);
            if(verifydata == null){
                return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
            }
            var status = req.body.status? req.body.status :'' ;
            var startDate = req.body.startDate ? req.body.startDate: '';
            var endDate = req.body.endDate ? req.body.endDate: '';
            var value = req.body.value?  req.body.value: '';
            if(!status) return res.json({status:0, message:'Status is required.'});
            tripModel.find(
              {$and:[{tripStatus: status}, {$or:[{customerName:{ $regex: value, $options : 'i'},driverName:{ $regex: value , $options : 'i'}}]
            }]}).then(data => {
                //console.log("added data ", data );
                return res.json({status :0 , data:data});
            }).catch(error => {
                //console.log("error occured for mongo query ", error);
            });
          },

        getTripsByStatus: async (req,res) =>{
              var verifydata = await Auth.validateAdmin(req.headers);
              if(verifydata == null){
                  return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
              }
              const {orderBy, order, page, limit, fieldName, fieldValue, startDate,endDate} =req.body
              var pageSize       = limit  || 10;
              var sortByField    = orderBy || "createdAt";
              var sortOrder      = order   || -1;
              var paged          = page || 1;
              let obj={};
              if(fieldName && fieldValue) {
                  obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
              }
              if(startDate) obj.createdAt =  { $gte : new Date(startDate) };
              if(endDate) obj.createdAt =  { $lte : new Date(endDate) };
              if (filter) {
                obj['$and'] = [];
                obj['$and'].push(
                  {
                      '$or': [
                              { customerName: { $regex: filter || '', $options: 'i' } },
                              { driverName: { $regex: filter || '', $options: 'i' } }
                            ]
                  }
                )
              }
              if(status){
                  if(!filter){ 
                    obj['$and'] = [];
                    obj['$and'].push({ tripStatus: status} );
                  } else {
                    obj['$and'].push({ tripStatus: status});
                  }
              } else {
                  obj['$and'] = [];
                  obj['$and'].push({ tripStatus: {$ne: "searching"}} );
              }

              if(startDate){
                if(!status || (status ==null && filter == null) ){      
                  obj['$and'] = [];  
                }
                obj['$and'].push({"tripCreatedAt":{"$gte":new Date(startDate),"$lte": endDate? new Date(endDate): new Date()}});
              }
              tripModel.aggregate(
                  [
                      {$match:obj},
                      {$sort :{[sortByField]: parseInt(sortOrder)}},
                      {$skip: (paged-1)*pageSize},
                      {$limit: parseInt(pageSize)}
                  ],function(err,data){
                    if(err){  
                      return res.json({status:0, message:'Error in trip list query.'})
                    }
                    else{   
                      return res.json({status:1, data:data})
                    }
              });
        },

        getDashboardDetails:  async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const {status, startDate,endDate,value} = req.body;
          if(!status) return res.json({status:0, message:'Status is required.'}); 
          var calculateMonthly = [];
          for(var i= moment().month() - 12; i < moment().month() + 1; i++){
              calculateMonthly.push({
              fromDate: new Date(moment().set('month',i-1)),
              toDate:  new Date(moment().set('month',i).utc())})    
          }
          var responseArray = [];
          var month = calculateMonthly;
          
          async.forEach(calculateMonthly, (month, callback)=> {

            tripModel.aggregate([
              {
                $match: {
                  tripCreatedAt: {$gte: month.fromDate, $lt: month.toDate}
                }
              },
              { 
                $group: { _id: null, trips: { $sum: 1 }, revenue: { $sum: "$estimatedCost" } } }],(queryError, queryRes)=> {
                if(queryError){
                  return res.json({ status: 0, data: 'Error occured in trips query' });
                } 
                else{
                  if(queryRes){
                    
                  responseArray.push({fromDate: month.fromDate,
                    toDate:  month.toDate,
                    revenue: queryRes && queryRes.length ?queryRes[0].revenue : 0,
                    NoOftrips:queryRes && queryRes.length ? queryRes[0].trips : 0 })
                    callback();
                  }
                }

              });
          },(err, result) => {
            //console.log("check the error 23 ", err, "check the reposne ", result , "     responseArray    ", responseArray);
            return res.json({ status: 1, data: responseArray, totalUser: 0,totalDriver:0 });
          });
        },

        
        getAllDriverTransactionsById : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const driverId  = req.params.id;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver ID is not valid'});
          driverPaymentModel.find({driverId:ObjectId(driverId)},function(err,data){
            if(err) return res.json({status:0, message:'Error in find query.'});
            else{
              return res.json({status:1, data:data})
            }
          });
        },

        
        getTripsByDriverId : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const driverId  = req.params.id;
          const {paymentMethod, tripStatus} = req.body;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver ID is not valid'});
          var query = {driverId: driverId , paymentMethod: paymentMethod, tripStatus: tripStatus};
          tripModel.find(query,function(err,data){
            if(err) return res.json({status:0, message:'Error in find query.'});
            else{
              return res.json({status:1, data:data})
            }
          });
        },

        getDriverTrips: async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const driverId  = req.params.id;
          if(!ObjectId.isValid(driverId)) return res.json({status:0, message:'Driver ID is not valid'});
          var query = {driverId: driverId , tripStatus: "completed"};
          tripModel.find(query,function(err,data){
            if(err) return res.json({status:0, message:'Error in find query.'});
            else{

              try {
                var result = [];

              data.forEach(element => {
                
                var de = 0;
                if(element.driverEarning != undefined){
                  de = element.driverEarning;
                }else{
                  de = 0;
                }

                var fdata = {
                  "tripId" : element._id,
                  "Cost($)" : element.cost,
                  "Driver Earned($)" : de,
                  "carType" : element.carTypeRequired,
                  "distance" : element.distance,
                  "Pick Up" : element.startLocationAddr,
                  "Drop Off" : element.endLocationAddr,
                  "Time(min)" : element.estimatedTime,
                  "Date" : new Date(element.tripCreatedAt).toLocaleDateString()
                }
                result.push(fdata);
              });

              res.setHeader('Content-disposition', 'attachment; filename=data.csv');
              res.set('Content-Type', 'text/csv');
              var dd = [
                {"a": 1, "b": 2, "c": 3},
                {"a": 4, "b": 5, "c": 6}
              ];
              res.csv(result, true, {
                "Access-Control-Allow-Origin": "*"
               })
              } catch (error) {
                //console.log(error);
              }
            }
          });
        },

        
        getTripsById : async (req,res) =>{
          var verifydata = await Auth.validateAdmin(req.headers);
          if(verifydata == null){
              return res.status(200).json({"status":"failure",message: "Not Authorized! Please logout and login!" ,data: {}, error:{}})
          }
          const tripId  = req.params.id;
          if(!ObjectId.isValid(tripId)) return res.json({status:0, message:'trip ID is not valid'});
          tripModel.find({_id:ObjectId(tripId) },function(err,data){
            if(err) return res.json({status:0, message:'Error in find query.'});
            else{
              return res.json({status:1, data:data})
            }
          });
        }
  }
