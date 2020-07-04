const FaqModel = require('../models/faq');
const ObjectId = require('objectid');
var Auth = require('../middleware/auth.js');
module.exports ={

  addFaq : async(req,res) =>{
    try{
      var verifydata = await Auth.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      let data = req.body
      if(!data.question){
        return res.json(helper.showValidationErrorResponse('QUESTION_REQUIRED')); 
      } 
      if(!data.answer) {
        return res.json(helper.showValidationErrorResponse('ANSWER_REQUIRED'));
      } 
      FaqModel.addFaq(data,(err,data)=>{
        if(err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }else{
          return res.json(helper.showSuccessResponse('FAQ_SAVED', data));
        }
      })
    }catch(error){
      //console.log(error);
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  editFaq : async (req,res) =>{
    try{
      var verifydata = await Auth.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const data = req.body;
      if(!ObjectId.isValid(data.FaqId)){
        return res.json(helper.showValidationErrorResponse('FAQ_ID_INVALID'));
      } 
      if(!data.question){
        return res.json(helper.showValidationErrorResponse('QUESTION_REQUIRED'));
      }
      if(!data.answer){
        return res.json(helper.showValidationErrorResponse('ANSWER_REQUIRED'));
      }
      FaqModel.updateFaq(data,(err,data)=>{
        if(err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else{
          return res.json(helper.showSuccessResponse('FAQ_UPDATED', data));
        }
      })
    }catch(error){
      //console.log("Error", error);
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },
  
  deleteFaq : async (req,res) =>{
    try{
      var verifydata = await Auth.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const data =req.body;
      if(!ObjectId.isValid(data.FaqId)) {
        return res.json(helper.showValidationErrorResponse('FAQ_ID_INVALID'));
      }  
      if(!data.status){
        return res.json(helper.showValidationErrorResponse('STATUS_REQUIRED'));
      }
      FaqModel.removeFaq(data.FaqId,(err,data)=>{
        if(err) {
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else{
          return res.json(helper.showSuccessResponse('FAQ_DELETED', data));
        }
      })
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getAllFaqs : async (req,res) =>{
    try{
      var verifydata = await Auth.validateAdmin(req.headers);
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
        obj[data.fieldName]={ $regex : data.fieldValue || '', $options : 'i'};
      }
      let count = await FaqModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
      FaqModel.getAllFaq(obj,sortByField,sortOrder,paged,pageSize,(err,resdata)=>{
        if(err) {
          //console.log("DB ERROR", err);
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        }
        else{
          let datacount = count[0]?count[0].count:0
          //console.log("Response Data", resdata);
          //console.log("Count", datacount);
          return res.json(helper.showSuccessResponseCount('FAQ_LIST', resdata,datacount));
        }
      })
     }catch(error){
         //console.log(error);
         return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
     }    
  },

  getFaqsById : async (req,res) =>{
    try{
      var verifydata = await Auth.validateAdmin(req.headers);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
      }
      const FaqId  = req.params.id;
      if(!ObjectId.isValid(FaqId)){
        return res.json(helper.showValidationErrorResponse('FAQ_ID_INVALID')); 
      } 
      FaqModel.getFaqById(FaqId,(err,data)=>{
        if(err){
          return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } 
        else{
          return res.json(helper.showSuccessResponse('FAQ_LIST', data));
        }
      })
    }catch(error){
      return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },
};