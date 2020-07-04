const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const driverpaymentsSchema = new Schema({
  driverId: { type: Schema.ObjectId, ref: 'drivers'},
  driver_pay_to_admin: { type: Number, default: 0 },
  admin_pay_to_driver : { type: Number, default: 0 },
  paymentType :{type:String, enum:['cash','other'],default:'cash'},
  transaction_id :{type:String,default:''},
  driverAccountId :{ type: Schema.ObjectId, ref: 'driverAccount'},
}, { timestamps: true });

driverpaymentsSchema.set('toObject');
driverpaymentsSchema.set('toJSON');
module.exports = mongoose.model('driverPayments', driverpaymentsSchema);
