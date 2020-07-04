const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contentSchema = new Schema({
   languageId: { type: String },
   languageCode: { type: String },
   name: { type: String, enum: ["ABOUT_US", "PRIVACY_POLICY", "REFUND_POLICY", "TERMS_CONDITIONS"], default: '' },
   content: { type: String, default: '' },
   status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

contentSchema.set('toObject');
contentSchema.set('toJSON');
const content = module.exports = mongoose.model('Content', contentSchema);


module.exports.getContents = function (callback) {
   content.find({}, callback).sort({ createdAt: -1 });
}

module.exports.addContent = function (data, callback) {
   var query = { name: data.name, languageCode: data.languageCode };
   content.findOneAndUpdate(query, data, { upsert: true, new: true }, callback);
}

module.exports.getContentData = (data, callback) => {
   return content.findOne({ name: data.name, languageCode: data.languageCode }, callback);
}

module.exports.getAboutUsText = function () {
   return content.findOne({ name: "ABOUT_US" });
}

module.exports.getPrivacyText = function () {
   return content.findOne({ name: "PRIVACY_POLICY" });
}

module.exports.getRefundText = function () {
   return content.findOne({ name: "REFUND_POLICY" });
}

//get contact us
module.exports.getContactUsText = function () {
   return content.findOne({ name: "Contact_Us" });
}
//get term and condition text
module.exports.getTermAndConditionText = function () {
   return content.findOne({ name: "TERMS_CONDITIONS" });
}

module.exports.getContentById = (id, callback) => {
   content.findById(id, callback);
}

module.exports.updateContent = (data, callback) => {
   var query = { _id: data.ContentId };
   data.updatedAt = new Date();
   content.findOneAndUpdate(query, data, { new: true }, callback);
}

module.exports.removeContent = (id, callback) => {
   var query = { _id: id };
   content.remove(query, callback);
}

module.exports.getAllContent = (obj,sortByField,sortOrder,paged,pageSize,callback) => { 
   content.aggregate([{$match:obj},
       {$sort :{[sortByField]:  parseInt(sortOrder)}},
       {$skip: (paged-1)*pageSize},
       {$limit: parseInt(pageSize) },
     ],callback);
 }