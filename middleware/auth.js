var customer = require("../models/userTable.js");
var Driver = require("../models/drivertable");
var Hotel = require("../models/hotelTable");
var Dispatcher = require("../models/dispatcherTable");
var jwt = require("jsonwebtoken");

module.exports.validateRoute = async (req, res, next) => {
  //console.log("check routing ");
  var headerData = req.headers;

  var token = headerData.token;

  if (token == config.key.token) {
    return next();
  }

  //     jwt.verify(token, 'secret',(err, token) => {
  //         console.log("data ", token , 'error >>>>>> ', err        );
  //     if (err) {
  //       return res.status(401).json({
  //         resStatus: 0,
  //         resMessage: 'The token is not valid!',
  //       });
  //     }else{ console.log("true case >>>>>>>");
  //         req.token = token;
  //         req.body.userData = token;
  //         next();
  //     }
  //   });
};

module.exports.validateCustomer = async (req) => {
  var customerid = req.get("customerid");
  var token = req.get("token");

  if (customerid != undefined && token != undefined) {
    try {
      var myuser = await customer.custAuth({
        customerid: customerid,
        token: token,
      });
      console.log(myuser, "getting the myuser");
      if (myuser.languageDetails != null) {
        if (myuser.languageDetails.languageCode != undefined) {
          req.setLocale(myuser.languageDetails.languageCode);
        }
      }

      return myuser;
    } catch (err) {
      var myuser = null;
      return myuser;
    }
  } else {
    var myuser = null;
    return myuser;
  }
};

module.exports.validateDispatcher = async (data) => {
  var headerData = data;
  var token = headerData.token;
  try {
    var decoded = jwt.verify(token, "secret");
    var dispatcher = await Dispatcher.findOne({
      _id: decoded._id,
      token: token,
    });
    if (!dispatcher) {
      return null;
    }
    return dispatcher;
  } catch (error) {
    console.log(error);
    return null;
  }
};

module.exports.validateHotel = async (data) => {
  var headerData = data;

  var hotelid = headerData.hotelid;
  var token = headerData.token;

  try {
    var decoded = jwt.verify(token, "secret");

    console.log("decoded", decoded);

    var hotel = await Hotel.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!hotel) {
      return null;
    }

    return hotel;
  } catch (error) {
    return null;
  }

  // if(hotelid != null){
  //     try{
  //         var myuser = await Hotel.hotelAuth({hotelid:hotelid,token:token});
  //         return myuser
  //     }catch(err){
  //         var myuser = null
  //         return myuser
  //     }
  // }else{
  //     var myuser = null
  //     return myuser;
  // }
};

module.exports.validateDriver = async (req) => {
  var driverid = req.get("driverid");
  var token = req.get("token");

  if (driverid != undefined && token != undefined) {
    try {
      var myuser = await Driver.driverAuth({
        driverid: driverid,
        token: token,
      });

      if (myuser.languageDetails != null) {
        if (myuser.languageDetails.languageCode != undefined) {
          req.setLocale(myuser.languageDetails.languageCode);
        }
      }

      return myuser;
    } catch (err) {
      var myuser = null;
      return myuser;
    }
  } else {
    var myuser = null;
    return myuser;
  }
};

module.exports.validateHotel = async (data) => {
  var headerData = data;

  var hotelid = headerData.hotelid;
  var token = headerData.token;

  if (hotelid != null) {
    try {
      var myuser = await Hotel.hotelAuth({ hotelid: hotelid, token: token });
      return myuser;
    } catch (err) {
      var myuser = null;
      return myuser;
    }
  } else {
    var myuser = null;
    return myuser;
  }
};

module.exports.validateAdmin = async (data) => {
  var headerData = data;
  var adminid = headerData.adminid;
  var token = headerData.token;
  if (adminid != null) {
    try {
      var myuser = await customer.adminAuth({ adminid: adminid, token: token });
      //console.log(myuser);
      return myuser;
    } catch (err) {
      var myuser = null;
      return myuser;
    }
  } else {
    var myuser = null;
    return myuser;
  }
};
