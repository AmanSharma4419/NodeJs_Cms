var mongoose = require('mongoose');

var dispatcherSchema = mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    dispatcherLocation: {
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
    dispatcherAvgRating: { type: Number, default: 0 }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

dispatcherSchema.index({ dispatcherLocation: "2dsphere" })

const dispatcher = module.exports = mongoose.model('dispatcher', dispatcherSchema);


module.exports.getDispatchers = function (callback, limit) {
    dispatcher.find(callback).limit(limit);
}

module.exports.addDispatcher = function (data, callback) {
    data.createdAt = new Date();
    data.updatedAt = new Date();
    dispatcher.create(data, callback);
}

module.exports.getDispatcherById = (id, callback) => {
    dispatcher.findById(id, callback);
}

module.exports.removeDispatcher = (id, callback) => {
    var query = { _id: id };
    dispatcher.remove(query, callback);
}

module.exports.findDispatcher = function (data) {
    return dispatcher.find({ email: data }).limit(1);
}

module.exports.getDispatcherByEmail = (data, callback) => {
    var query = { email: data.email };
    return dispatcher.findOne(query, callback);
}

module.exports.getDispatcherByName = (data, callback) => {
    var query = { name: data.name };
    return dispatcher.findOne(query, callback);
}

module.exports.updateTokenDispatcher = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        token: data.token

    }
    dispatcher.findOneAndUpdate(query, update, { fields: { password: 0 }, new: true }, callback);
}

module.exports.dispatcherAuth = (data) => {
    return dispatcher.findOne({ _id: data.dispatcherid, token: data.token });
}


module.exports.updateProfile = async (data, callback) => {
    var query = { _id: data.dispatcherId };
    dispatcher.findOneAndUpdate(query, data, { fields: { password: 0 }, "new": true }, callback);
}


module.exports.AddRefToTrip = (data, callback) => {
    var query = { _id: data.dispatcherId };
    var ref = data.ref;
    dispatcher.findOneAndUpdate(query, {
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
module.exports.updateOTPDispatcher = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: data.OTP,
        OTPexp: data.OTPexp
    }
    dispatcher.findOneAndUpdate(query, update, {"new": true }, callback);
}

module.exports.updatePasswordDispatcherPanle = async (data, callback) => {
    var query = { email: data.email };
    var update = {
        OTP: "",
        OTPexp: "",
        token: data.token,
        password: data.password
    }
    dispatcher.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}

module.exports.updatePasswordDispatcher = async (data, callback) => {
    var query = { _id: data.dispatcherId };
    var update = {
        token: data.token,
        password: data.password
    }
    dispatcher.findOneAndUpdate(query, update, { fields: { password: 0 }, "new": true }, callback);
}