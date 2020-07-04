var mongoose = require('mongoose');
// can add city and country for more dynamic nature
// add var for enum here and dynamic list here
var promocodesSchema = mongoose.Schema({
    promocode:  {type: String , required: true },
    type:       {type: String ,enum:['Flat','Percent']}, 
    amount:     {type: Number , required: true},
    maxAmount:  {type: Number, required: true},
    createdBy:  {type: String},
    name:       {type: String},
    detials:    {type: Object,default:null },
    createdAt:  {type: Date},
    city:       {type: String,default:null },
    state:      {type: String,default:null },
    country:    {type: String,default:null },
    level:      {type: String, enum:['city','state','country','global','list'], default:"global"},
    upto:       {type: Date, required: true},
    visible:    {type: Boolean},
    limit:      {type: Number,default:null },   
    TC:         {type: String},
})


const PCssch = module.exports =  mongoose.model('promocodes' , promocodesSchema);

module.exports.getAllPromoCodes = (callback) => {
	PCssch.find({}, callback);
}

module.exports.getAllPromoCodesVisible = (callback) => {
	PCssch.find({visible: true,level:'global' , upto:{$gt : new Date()}}, callback);
}
module.exports.getAllPromoCodesVisible1 = (callback) => {
	return PCssch.find({visible: true,level:'global' , upto:{$gt : new Date()}});
}

module.exports.listpromocode =async (data) => {

    //var city = await PCssch.find({city:data.city,level:'city' , upto:{$gt : new Date()}});
    //var state= await  PCssch.find({state:data.state,level:'state' , upto:{$gt : new Date()}});
    //var country= await  PCssch.find({country:data.country,level:'country' , upto:{$gt : new Date()}});
    // can add personal level promo codes here too
    var global = await PCssch.find({level:'global' , upto:{$gt : new Date()}});
    var retdata = [];
    if(global.length!=0 || global != undefined){
        global.forEach(fdata=>{
        retdata.push(fdata)
        })
    }
    // if(country.length!=0 || country != undefined){
    //     country.forEach(fdata=>{
    //     retdata.push(fdata)
    //     })
    // }
    // if(state.length!=0 || state != undefined){
    //     state.forEach(fdata=>{
    //     retdata.push(fdata)
    //     })
    // }
    // if(city.length!=0 || city != undefined){
    //     city.forEach(fdata=>{
    //     retdata.push(fdata)
    //     })
    // }
    return retdata
}

module.exports.findpromocode =(data,callback) => {
    return PCssch.findOne({promocode:data.promocode},callback);
}
module.exports.findpromocodea =async (data) => {
    return PCssch.findOne({promocode:data.promoCode});
}

module.exports.findpromocodeCallback = (data, callback) => {
    PCssch.findOne({promocode:data.promocode, visible: true, upto:{$gt : new Date()}},callback);
}

module.exports.createPromocode = function(data, callback){
    var query={
        promocode: data.promocode,
        upto:     {$gt : new Date()}
    }
    var update = {
        promocode:  data.promocode,
        type:       data.type,  // need to add enum here
        amount:     data.amount,
        createdBy:  data.createdBy,
        name:       data.name,
        detials:    data.detials,
        createdAt:  new Date(),
        city:       data.city,
        state:      data.state,
        country:    data.country,
        level:      data.level,
        upto:       data.upto,
        visible:    data.visible,
        limit:      data.limit,
        TC:         data.TC    
    }
    PCssch.findOneAndUpdate(query, update, { upsert: true,"new": true}, callback);
}

module.exports.removepromocode = function(id, callback){
    var query = {_id: id};
	PCssch.remove(query, callback)
}

module.exports.getPromocodeList = (obj,sortByField,sortOrder,paged,pageSize,callback) => { 
    PCssch.aggregate([{$match:obj},
        {$sort :{[sortByField]:  parseInt(sortOrder)}},
        {$skip: (paged-1)*pageSize},
        {$limit: parseInt(pageSize) },
      ],callback);
}

module.exports.updateStatus = (id, status, callback) => {
    var query = {
        _id:id
    }
    if(!status){
        var update = {
            visible: false
        }
    }else{
        update = {
            visible: true
        }
    }
    PCssch.findOneAndUpdate(query, update, { upsert: true,"new": true}, callback);  
}

