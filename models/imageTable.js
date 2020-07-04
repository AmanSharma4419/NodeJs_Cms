var mongoose = require('mongoose');

var imageSchema = mongoose.Schema({
    artistId:             {type:String,required:true},
    artistRefId:          {type: mongoose.Schema.Types.ObjectId, ref: 'artist'},
    imageUrl:             {type: String,required:true},
    createdAt:            {type: Date},
    updatedAt:            {type: Date}
},
{
    versionKey: false // You should be aware of the outcome after set to false
});
 
const imageTable = module.exports = mongoose.model('Image', imageSchema);

//get all images
module.exports.getAllImages = function(data,callback) {
	imageTable.find({},callback);
}

module.exports.getAllArtistPortfolio = function(data,callback) {
	return imageTable.find({artistId:data.artistId},callback);
}

//add To Image
module.exports.addImage = function(data, callback){
    data.createdAt = new Date();  
    data.updatedAt = new Date();  
    imageTable.create(data,callback);
}

//remove Image
module.exports.removeImage = (data, callback) => {
	var query = {_id: data.imageId};
	imageTable.remove(query, callback);
}