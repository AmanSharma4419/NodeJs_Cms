var mongoose = require('mongoose');

var errorSchema = mongoose.Schema({
    error_desc: {type: String,default:"null"},
    createdAt: {type: Date},
    UpdatedAt:{type: Date},
},
{
    versionKey: false // You should be aware of the outcome after set to false
});
 
const err = module.exports = mongoose.model('Error', errorSchema);

module.exports.addError = function(message, callback){
      let error = {
        error_desc:message,
        createdAt:new Date(),
        UpdatedAt:new Date()
      }

      err.create(error, callback)
}