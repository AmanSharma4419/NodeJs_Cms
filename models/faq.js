const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const faqSchema = new Schema({
  languageId: { type: String },
  languageCode: { type: String },
  question: { type: String, default: '' },
  answer: { type: String, default: '' },
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

faqSchema.set('toObject');
faqSchema.set('toJSON');

const Faq = module.exports = mongoose.model('Faq', faqSchema);

module.exports.getAllFaq = (obj,sortByField,sortOrder,paged,pageSize,callback) => {
  Faq.aggregate([
    {$match:obj},
    {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
    {$limit: parseInt(pageSize)},
  ],callback);
}

module.exports.getFaqs = function (callback) {
  Faq.find({ status: 1 }, callback).sort({ createdAt: -1 });
}

module.exports.addFaq = function (data, callback) {
  Faq.create(data, callback);
}

module.exports.getFaqById = (id, callback) => {
  Faq.findById(id, callback);
}

module.exports.getContentData = (data, callback) => {
  return Faq.find({ languageCode: data.languageCode, status: 1 }, callback);
}

module.exports.updateFaq = (data, callback) => {
  var query = { _id: data.FaqId };
  data.updatedAt = new Date();
  Faq.findOneAndUpdate(query, data, { new: true }, callback);
}

module.exports.removeFaq = (id, callback) => {
  var query = { _id: id };
  Faq.remove(query, callback);
}


