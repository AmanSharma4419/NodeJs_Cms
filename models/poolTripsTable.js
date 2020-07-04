var mongoose = require('mongoose');

var PoolTripSchema = mongoose.Schema({
    driverId: { type: String, default: "", required: true, trim: true },
    seatAvailability: { type: String, trim: true },
    countryDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    cityName: { type: String, default: "", unique: true, trim: true },
    cityCode: { type: String, default: "", uppercase: true },
    status: { type: String, enum: ["yes", "no"], default: "yes", lowercase: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

///PoolTripSchema.index({ cityName: 1, status: 1 }, { background: true });

const PoolTripTable = module.exports = mongoose.model('PoolTrip', PoolTripSchema);