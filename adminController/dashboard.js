const tripModel = require('../models/triptable');
const userModel = require('../models/userTable');
const driverModel = require('../models/drivertable');
//const storeModel = require('../models/storeTable');
const ObjectId = require('objectid');
var authroute = require('../middleware/auth.js');

module.exports ={

  getCancelList: async(req,res) =>{
     try{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
          return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        const data = req.body;
        const pageSize       = data.limit  || 10;
        const sortByField    = data.orderBy || "createdAt";
        const sortOrder      = data.order   || -1;
        const paged          = data.page || 1;
        let obj={};
        obj.tripStatus = 'cancelled';
        if(data.fieldName && data.fieldValue) obj[data.fieldName]={ $regex : data.fieldValue || '', $options : 'i'};
        if(data.startDate) obj.createdAt =  { $gte : new Date(data.startDate) };
        if(data.endDate) obj.createdAt =  { $lte : new Date(data.endDate) };
        tripModel.aggregate(
            [
                {$match:obj},
                {$sort :{[sortByField]:  parseInt(sortOrder)}},
                {$skip: (paged-1)*pageSize},
                {$limit: parseInt(pageSize) }

            ],function(err,data){
                if(err){
                  return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else{
                  return res.json(helper.showSuccessResponse('DASHBOARD_LIST', data));
                }
           });
     }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
     }
  },

  getCancelDetailsById: async(req,res) =>{
     var verifydata = await authroute.validateAdmin(req.headers);
     if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
     }
     const tripId =req.params.id;
     if(!ObjectId.isValid(tripId)){
        return res.json(helper.showValidationErrorResponse('TRIP_ID_INVALID'));
     }
     tripModel.find({_id:ObjectId(tripId),orderStatus:'cancelled'},function(err,data){
       if(err){
        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
       }
       else{
          return res.json(helper.showSuccessResponse('CANCEL_TRIP_LIST', data));
       }
     });
  },

  allTripsWithFilter: async(req,res) => {
    try{
      const data = req.body;
      const pageSize       = data.limit  || 10;
      const sortByField    = data.orderBy || "createdAt";
      const sortOrder      = data.order   || -1;
      const paged          = data.page || 1;
      let obj={};
      if(data.fieldName && data.fieldValue) obj[data.fieldName]={ $regex : data.fieldValue || '', $options : 'i'};
      if(data.startDate) obj.createdAt =  { $gte : new Date(data.startDate) };
      if(data.endDate) obj.createdAt =  { $lte : new Date(data.endDate) };
       let count = await tripModel.aggregate([{$match:{tripStatus:{"$in":data.status}}},{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
       let totalcount = count.length>0?count[0].count:0;
       tripModel.getAllTripsWithFilter(obj,sortByField,sortOrder,paged,pageSize,data.status,(err,data)=>{
             if(err){
                  return res.status(200).json({ "message": "Error in trip query", data: {}, "error": err });   
             }else{
                  return res.status(200).json({ "message": "All Trip Request", totalcount:totalcount , data: data, "error": {} });   
             }
       })
    }catch(error){
        //console.log(error);
        return res.status(500).json({ "message": "Internal server Error!", data: {}, "error": error }); 
    }
  },

  getReviewsList : async(req,res) =>{
    var verifydata = await authroute.validateAdmin(req.headers);
    if (verifydata == null) {
      return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
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
    tripModel.aggregate([
         {$match:obj},
         {$project : {customerMobile:1,customerName : 1, driverMobileNumber:1 ,review : 1} },
         {$sort :{[sortByField]:  parseInt(sortOrder)}},
         {$skip: (paged-1)*pageSize},
         {$limit: parseInt(pageSize) }
     ],function(err,data){
       if(err){
         return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
       }
       else{
        return res.json(helper.showSuccessResponse('REVIEWS_LIST', data));
       }
     });
  },

  getReviewsById : async (req,res) =>{
    var verifydata = await authroute.validateAdmin(req.headers);
    if (verifydata == null) {
      return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
    }
    let tripId = req.params.id;
    if(!ObjectId.isValid(tripId)){
      return res.json(helper.showValidationErrorResponse('TRIP_ID_INVALID'));
    }
    tripModel.find({_id:ObjectId(tripId)},{customerMobile: 1, customerName : 1, driverMobileNumber:1 ,review : 1},function(err,data){
      if(err){
        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
      }
      else{
        return res.json(helper.showSuccessResponse('TRIP_REVIEWS', data));
      }
    });
  },

  deleteReview : async (req,res) =>{
    var verifydata = await authroute.validateAdmin(req.headers);
    if (verifydata == null) {
      return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
    }
    let tripId = req.params.id;
    if(!ObjectId.isValid(tripId)){
      return res.json(helper.showValidationErrorResponse('TRIP_ID_INVALID'));
    } 
    tripModel.remove({_id:ObjectId(tripId)},function(err,data){
      if(err){
        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
      }
      else{
        return res.json(helper.showSuccessResponse('REVIEW_DELETED', data));
      }
    });
  },

  getCompletedTripList: async(req,res) =>{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
          return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
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
        if(status) obj.tripStatus = status;
        else{
            obj.tripStatus = 'completed';
        }
        tripModel.aggregate([
            {$match:obj},
            {$sort :{[sortByField]:  parseInt(sortOrder)}},
            {$skip: (paged-1)*pageSize},
            {$limit: parseInt(pageSize) }
        ],function(err,data){
            if(err){
                return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            }
            else{
              return res.json(helper.showSuccessResponse('COMPLETED_TRIP', data));
            }
        });
  },

  getCompletedDetailsById: async(req,res) =>{
        var verifydata = await authroute.validateAdmin(req.headers);
        if (verifydata == null) {
          return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        const tripId =req.params.id;
        if(!ObjectId.isValid(tripId)){
          return res.json(helper.showValidationErrorResponse('TRIP_ID_INVALID'));
        } 
        tripModel.getCompletedTripById(ObjectId(tripId),(err,data)=>{
          if(err){
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
          }
          else{
            return res.json(helper.showSuccessResponse('COMPLETED_TRIP', data));
          }
        })
  },

  getDashboardList : async (req,res) =>{
    let c = new Date();
    let aa = c.setMonth(c.getMonth() -12);
    let totalUser = await userModel.find({role: {$ne: 'ADMIN'}});
    let totalDriver = await driverModel.find({status:'approved'});
    //let totalStore = await storeModel.find({status:'approved'});
    tripModel.find({tripCreatedAt:{ $gte: new Date(aa) }},function(err,data){
      if(err){
        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
      }else{
          let reData = data
          reData.totalUser = totalUser;
          reData.totalDriver = totalDriver;
          let dashboarddata = {totalTrip:reData,totalUser:totalUser,totalDriver:totalDriver}
          return res.json(helper.showSuccessResponse('DASHBOARD_LIST', dashboarddata));
      }
    })
  }
}
