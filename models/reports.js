var mongoose = require('mongoose');

var statsSchema = mongoose.Schema({
    driverId: { type: String, required: true },
    day: { type: String },
    date: { type: Date },
    earned: { type: Number, default: 0 },
    rejected: { type: Number, default: 0 },
    timeOnline: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    accepted: { type: Number, default: 0 },
    canceled: { type: Number, default: 0 },
    receivedRequest: { type: Number, default: 0 },
    tripId: { type: String }
})


const stats = module.exports = mongoose.model('reports', statsSchema);

module.exports.findStats = function (data, callback) {
    return stats.find({ email: data.email }, callback);
}

module.exports.findallStats = function (callback) {
    return stats.find({}, callback);
}

module.exports.checkDayStats = function (data, callback) {
    return stats.findOne({ driverId: data.driverId, day: data.day }, callback);
}

module.exports.sevenDaysStats = function (data, callback) {
    return stats.find({
        driverId: data.driverId, date: {
            $lte: data.to,
            $gt: data.from
        }
    }, callback);
}

module.exports.addStats = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    try { var eData = await stats.checkDayStats({ email: data.email, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        data.earned = data.earned + eData.earned;
        data.rejected = data.rejected + eData.rejected;
        data.timeOnline = data.timeOnline + eData.timeOnline;
        data.completed = data.completed + eData.completed;
        data.accepted = data.accepted + eData.accepted;
        data.canceled = data.canceled + eData.canceled;
        data.receivedRequest = data.receivedRequest + eData.receivedRequest;
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        earned: data.earned,
        rejected: data.rejected,
        timeOnline: data.timeOnline,
        completed: data.completed,
        accepted: data.accepted,
        canceled: data.canceled,
        receivedRequest: data.receivedRequest
    }
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}



module.exports.addHours = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.timeOnline != undefined || eData.timeOnline != NaN) {
            data.timeOnline = data.timeOnline + eData.timeOnline
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        timeOnline: data.timeOnline,
    }
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}



module.exports.addCompletedEarned = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    //console.log(data);
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.completed != undefined || eData.earned != undefined || eData.completed != NaN || eData.earned) {
            data.earned = data.earned + eData.earned;
            data.completed = data.completed + eData.completed
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        completed: data.completed,
        earned: data.earned
    }
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}



module.exports.addRejected = async (data, callback) => {
    var day = new Date();
    day = day.toLocaleDateString();
    //console.log(day);
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.rejected != undefined) {
            data.rejected = data.rejected + eData.rejected;
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        rejected: data.rejected,
    }
    //console.log(update);
    // console.log(query);
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true }, callback)
}



module.exports.addAccepted = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.accepted != undefined) {
            data.accepted = data.accepted + eData.accepted;
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        accepted: data.accepted
    }
    // console.log(update);
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}



module.exports.addCanceled = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.canceled != undefined) {
            data.canceled = data.canceled + eData.canceled;
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        date: new Date(),
        canceled: data.canceled,
    }
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}



module.exports.addRequestRec = async (data) => {
    var day = new Date();
    day = day.toLocaleDateString();
    try { var eData = await stats.checkDayStats({ driverId: data.driverId, day: day }) } catch (err) { };
    if (eData != undefined || eData != null) {
        if (eData.receivedRequest != undefined) {
            data.receivedRequest = data.receivedRequest + eData.receivedRequest;
        }
    }
    var query = { driverId: data.driverId, day: day };
    var update = {
        day: day,
        driverId: data.driverId,
        tripId: data.tripId,
        date: new Date(),
        receivedRequest: data.receivedRequest,
    }
    return stats.findOneAndUpdate(query, update, { upsert: true, new: true })
}