var mongoose = require('mongoose');
// can add city and country for more dynamic nature
// add var for enum here and dynamic list here
var promocodesusedSchema = mongoose.Schema({
    promocode:          {type: String , required: true },
    customerId:         {type: String}, 
    usedAt:             {type: Date},
})


const PCUssch = module.exports =  mongoose.model('promocodesused' , promocodesusedSchema);

module.exports.addusedcode = function(data, callback){
    var update = {
        promocode:  data.promocode,
        customerId: data.customerId,  // need to add enum here
        usedAt:     new Date(),
    }
    PCUssch.create(update,callback);;
}
module.exports.findpromocode =async (data) => {
    return PCUssch.find({promocode:data.promocode,customerId: data.customerId});
}