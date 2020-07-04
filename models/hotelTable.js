var mongoose = require('mongoose');

var hotelSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    hotelLocation: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    city: { type: String, default: null },
    countryName: { type: String, default: null },
    trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trips' }],
    tokens: [{ 
        token :{type: String}
      }],
    token: { type: String },
    restToken: { type: String },
    OTP: { type: String },
    OTPexp: { type: Date, default: null },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    hotelAvgRating: { type: Number, default: 0 }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

hotelSchema.index({ hotelLocation: "2dsphere" })

const hotel = module.exports = mongoose.model('hotel', hotelSchema);


module.exports.getHotels = function (callback, limit) {
    hotel.find(callback).limit(limit);
}

module.exports.addHotel = function (data, callback) {
    data.createdAt = new Date();
    data.updatedAt = new Date();
    hotel.create(data, callback);
}

module.exports.getHotelById = (id, callback) => {
    hotel.findById(id, callback);
}

module.exports.removeHotel = (id, callback) => {
    var query = { _id: id };
    hotel.remove(query, callback);
}

module.exports.findHotel = function (data) {
    return hotel.find({ email: data }).limit(1);
}

module.exports.getHotelByEmail = (data, callback) => {
    var query = { email: data.email };
    return hotel.findOne(query, callback);
}

module.exports.getHotelByName = (data, callback) => {
    var query = { name: data.name };
    return hotel.findOne(query, callback);
}

module.exports.updateTokenHotel = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        token: data.token

    }
    hotel.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}

module.exports.hotelAuth = (data) => {
    return hotel.findOne({ _id: data.hotelid, token: data.token });
}


module.exports.updateProfile = async (data, callback) => {
    var query = { _id: data.hotelId };
    hotel.findOneAndUpdate(query, data, { fields: { password: 0 }, "new": true }, callback);
}


module.exports.AddRefToTrip = (data, callback) => {
    var query = { _id: data.hotelId };
    var ref = data.ref;
    hotel.findOneAndUpdate(query, {
        $push: {
            trips: ref
        }
    }, { upsert: true, new: true }, function (err, data) {
        if (err) {
            console.log(err)
        }
    });
}

// update OTP for FM
module.exports.updateOTPHotel = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: data.OTP,
        OTPexp: data.OTPexp
    }
    hotel.findOneAndUpdate(query, update, {"new": true }, callback);
}

module.exports.updatePasswordHotelPanle = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: "",
        OTPexp: "",
        token: data.token,
        password: data.password
    }
    hotel.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}

module.exports.updatePasswordHotel = async (data, callback) => {
    var query = { _id: data.hotelId };
    var update = {
        token: data.token,
        password: data.password
    }
    hotel.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}