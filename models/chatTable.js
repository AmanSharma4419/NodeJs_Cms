var mongoose = require("mongoose");

var chatSchema = mongoose.Schema(
  {
    customerId: { type: String, required: true },
    customerRefId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driverId: { type: String, required: true },
    driverRefId: { type: mongoose.Schema.Types.ObjectId, ref: "driver" },
    customerWindowStatus: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
    },
    driverWindowStatus: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
    },
    customerUnreadMessages: { type: Number, default: 0 },
    driverUnreadMessages: { type: Number, default: 0 },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  {
    versionKey: false,
  }
);

const chatTable = (module.exports = mongoose.model("chat", chatSchema));

module.exports.addChat = (data, callback) => {
  var query = { customerId: data.customerId, driverId: data.driverId };
  var update = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    driverId: data.driverId,
    driverRefId: data.driverId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  chatTable.findOneAndUpdate(
    query,
    update,
    { upsert: true, new: true },
    callback
  );
};

module.exports.getChatById = (id, callback) => {
  chatTable.findById(id, callback);
};
//get customer chat
module.exports.getCustomerChat = (data, callback) => {
  return chatTable
    .find({ customerId: data.customerId })
    .populate({ path: "driverRefId", select: "name profileImage driverStatus" })
    .exec(callback);
};

module.exports.getUserChat = (data, callback) => {
  return chatTable.findOne(
    { customerId: data.customerId, driverId: data.driverId },
    callback
  );
};

//get artist chat
module.exports.getDriverChat = (data, callback) => {
  return chatTable
    .find({ driverId: data.driverId })
    .populate({
      path: "customerRefId",
      select: "name profileImage customerStatus",
    })
    .exec(callback);
};

//update customer chat window status
module.exports.updateUserChatStatus = (data, callback) => {
  var query = { _id: data.chatId };
  var update = {
    customerWindowStatus: data.customerWindowStatus,
    customerUnreadMessages: 0,
    updatedAt: new Date(),
  };
  return chatTable.findOneAndUpdate(query, update, { new: true }, callback);
};

module.exports.updateDriverChatStatus = (data, callback) => {
  var query = { _id: data.chatId };
  var update = {
    artistWindowStatus: data.artistWindowStatus,
    artistUnreadMessages: 0,
    updatedAt: new Date(),
  };
  return chatTable.findOneAndUpdate(query, update, { new: true }, callback);
};

module.exports.updateMessageCount = (data, callback) => {
  var query = { _id: data.chatId };
  var update = {
    customerUnreadMessages: data.customerUnreadMessages,
    artistUnreadMessages: data.artistUnreadMessages,
    updatedAt: new Date(),
  };
  return chatTable.findOneAndUpdate(query, update, { new: true }, callback);
};
