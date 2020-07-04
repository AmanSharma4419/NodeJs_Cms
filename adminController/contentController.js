const ContentModel = require('../models/contenttable');
const ObjectId = require('objectid');
var Auth = require('../middleware/auth.js');
module.exports ={

  addContent : async(req,res) =>{
      try{
          var verifydata = await Auth.validateAdmin(req.headers)  
          if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
          }
          const data = req.body;
          if(!data.name){
            return res.json(helper.showUnathorizedErrorResponse('CONTENT_NAME_REQUIRED'));
          }
          if(!data.content){
            return res.json(helper.showUnathorizedErrorResponse('CONTENT_REQUIRED'));
          }
          ContentModel.addContent(data,(err,data)=>{
            if(err) {
              return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            }
            else{
              return res.json(helper.showSuccessResponse('CONTENT_SAVED', data));
            }
          })
      }catch(error){
          return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
  },

  editContent : async (req,res) =>{
      try{
          var verifydata = await Auth.validateAdmin(req.headers)  
          if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
          }
          const data = req.body;
          if(!ObjectId.isValid(data.ContentId)){
            return res.json(helper.showValidationErrorResponse('CONTENT_ID_INVALID'));
          } 
          if(!data.name){
            return res.json(helper.showValidationErrorResponse('CONTENT_NAME_REQUIRED'));
          }
          if(!data.content){
            return res.json(helper.showValidationErrorResponse('CONTENT_REQUIRED'));
          }
          ContentModel.updateContent(data,(err,data)=>{
            if(err){
              return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            }
            else{
              return res.json(helper.showSuccessResponse('CONTENT_SAVED', data));
            }
          })
      }catch(error){
         return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
  },

  deleteContent : async (req,res) =>{
    try{
        var verifydata = await Auth.validateAdmin(req.headers)  
        if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
        }
        const data = req.body;
        if(!ObjectId.isValid(data.ContentId)){
          return res.json(helper.showValidationErrorResponse('CONTENT_ID_INVALID'));
        }  
        ContentModel.remove({ _id: req.body.contentId }, function(err) {
          if (err) {
            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
          }
          else {
             return res.json(helper.showSuccessResponse('CONTENT_DELETED', {}));
          }
        });
    }catch(error){
         return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
    }
  },

  getAllContents : async (req,res) =>{
      try{
          var verifydata = await Auth.validateAdmin(req.headers)  
          if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
          }
          const data = req.body;
          let obj = {};
          var pageSize       = data.limit  || 10;
          var sortByField    = data.orderBy || "createdAt";
          var sortOrder      = data.order   || -1;
          var paged          = data.page || 1;
          if(data.fieldName && data.fieldValue) {
            obj[data.fieldName]={ $regex : data.fieldValue || '', $options : 'i'};
          }
          let count = await ContentModel.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
          ContentModel.getAllContent(obj,sortByField,sortOrder,paged,pageSize,(err,resdata)=>{
            if(err) {
              return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            }
            else{
              let datacount = count[0]?count[0].count:0;
              return res.json(helper.showSuccessResponseCount('CONTENT_DATA', resdata, datacount));
            }
          })
      }catch(error){
        //console.log(error);
        return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
  },

  getContentById : async (req,res) =>{
      try{
          var verifydata = await Auth.validateAdmin(req.headers)  
          if(verifydata == null){
            return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
          }
          const ContentId  = req.params.id;
          if(!ObjectId.isValid(ContentId)){
            return res.json(helper.showValidationErrorResponse('CONTENT_ID_INVALID'));
          } 
          ContentModel.getContentById(ContentId,(err,data)=>{
            if(err){
              return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
            } 
            else{
              return res.json(helper.showSuccessResponse('CONTENT_DATA', data));
            }
          })
      }catch(error){
          return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
      }
  }
};