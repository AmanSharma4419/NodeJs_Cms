var upload = require('../lib/awsimageupload.js');
var deleteaws = require('../lib/awsdelete.js');
var profileImageUpload = upload.any();
var LPM = require('../models/listPMethods');
var POs = require('../models/hotelPaymentOptions');
var paymenthandler = require('../lib/paymenthandler');
var authroute = require('../middleware/auth.js');


module.exports = {

    addPaymentMethods : async(req, res) => {
        try{
            profileImageUpload(req, res, async function(err, some)  {
                var file = req.files;
                var data = req.body;
                //checking for email in DB
                var verify = await LPM.getPMsByType({type:data.type});
                // checking if there are any files or null
                if(!file){
                    return res.status(400).json({"message":"Please upload image!.","data":{}, "error": {}});
                }
                // if any error on AWS
                if (err) {
                return res.status(422).send({"message": "Image Upload Error", "data":{}, "error": err});
                }
                try{
                data.logo = req.files[0].location
                }
                catch(err){
                    return res.status(400).json({"message":"Please upload image!.", "data":{}, "error": err})
                }
                // clearing AWS S3 of previous images
                if(verify){
                    var keyimage = verify.logo;
                    deleteaws(keyimage);
                }
                try{       // updating in DB
                    LPM.addPMs(data, (err,resdata)=>{
                        if (err || resdata === null){
                            return res.status(404).json({"message":"Not Able to add Payment Method","data":{}, "error": err})
                        }
                        else{
                            return res.json({"message":"Added Payment Method","data":resdata, "error": {}})
                        }
                    });
                }
                catch(err){
                    console.log(err);
                    return res.status(400).json({"message":"Not able to Upload Image try dagin","data":{}, "error": err})
                }
            })
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    deletePaymentMethodById : async(req, res) => {
        try{
            var data = req.body;
            LPM.removePMs( data._id,(err,resdata)=>{
                console.log(resdata)
                if (err){
                    return res.status(400).json({"message":"Already deleted","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment method Deleted","data":{}, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    getEnabledPaymentMethodList : async(req, res) => {
        try{
            var verifyData = req.headers;
            LPM.getPMsVisible( (err,resdata)=>{
                if (err || resdata.length == 0){
                    return res.status(404).json({"message":"No List available","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment Method List","data":resdata, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    getUserAddedPaymentOptions : async(req, res) => {
        try{
            var data = req.body;
            var verifydata = await authroute.validateHotel(req.headers);
            if(verifydata == null){
                return res.status(401).json({message: "Not Authorized!" ,data: {}, error:{}});
            }

            data.hotelId = verifydata._id;
            
            POs.getPObyHotelId( data,(err,resdata)=>{
                if (err || resdata.length == 0){
                    return res.status(404).json({"message":"No List available","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment Options List","data":resdata, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    getUserSelectedPaymentOption : async(req, res) => {
        try{
            var data = req.body;
            var verifydata = await authroute.validateHotel(req.headers);
            if(verifydata == null){
                return res.status(401).json({message: "Not Authorized!" ,data: {}, error:{}});
            }
            POs.getSelectedPO( data.hotelId,(err,resdata)=>{
                if (err || resdata === null){
                    return res.status(404).json({"message":"No Payment Option available","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment Option","data":resdata, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    updateUserSelectedPaymentOption : async(req, res) => {
        try{
            var data = req.body;
            var verifydata = await authroute.validateHotel(req.headers);
            if(verifydata == null){
                return res.status(401).json({message: "Not Authorized!" ,data: {}, error:{}});
            }

            data.hotelId = verifydata._id;
            
            POs.updateSelected( data,(err,resdata)=>{
                console.log(resdata)
                if (err || resdata === null){
                    return res.status(404).json({"message":"No able to update Payment Option","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment Option Updated","data":{}, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    },

    addUserPaymentOption : async(req, res) => {
        try {
            var data = req.body;
            var  verifydata = await authroute.validateHotel(req.headers);
            if(verifydata == null){
                return res.status(401).json({"message": "Not Authorized!" ,data: {}, "status":"failure"})
            }

            var data = req.body;

            if (!data.type) {
                return res.status(400).json({ "status": "failure", "message": "Card type is required!", "data": {}, "error": {} });
            }

            if (!data.lastd) {
                return res.status(400).json({ "status": "failure", "message": "Last 4 Digit is required!", "data": {}, "error": {} });
            }

            if (!data.token) {
                return res.status(400).json({ "status": "failure", "message": "Stripe Token  is required!", "data": {}, "error": {} });
            }

            var mdata = {type: "Card"}
            var verifypms = await LPM.getPMsByType(mdata);
            if(!verifypms || verifypms === undefined){
                return res.status(404).json({"message":"Not Able to Find Payment Method by that name","data":{}, "error": {}})
            }
            data.logo = verifypms.logo;
            data.email = verifydata.email;
            data.hotelId = verifydata._id;

            paymenthandler.POhandler(data,(err,handler) => {
                  if(err){
                    return res.status(400).json({"status":"failure","message":err.message,"data":{},"error": err});
                  }

                  data.token = handler.id;

                  POs.addPaymentOptions(data, (err,resdata)=>{
                    if (err || resdata === null){
                        return res.status(404).json({"message":"Not Able to add Payment Method","data":{}, "error": err})
                    }
                    else{
                        return res.json({"message":"Added Payment Method","data":resdata, "error": {}})
                    }
                });
            });
            
     }
     catch(err){
       return res.status(500).json({"message":"Add Card Stripe Error!","data":{}, "error": err});
     }
    },

    deleteUserPaymentOption : async(req, res) => {
        try{
            var data = req.body;
            var  verifydata = await authroute.validateHotel(req.headers);
            if(verifydata == null){
                return res.status(401).json({"message": "Not Authorized!" ,data: {}, "status":"failure"})
            }
            
            POs.removePO( data._id,(err,resdata)=>{
                console.log(resdata)
                if (err || resdata == null){
                    console.log("errr", err);
                    return res.status(400).json({"message":"Already deleted","data":{}, "error": err})
                }
                else{
                    return res.json({"message":"Payment Option Deleted","data":{}, "error": {}})
                }
            });
        }
        catch(err){
            return res.status(500).json({"message":"Internal Server Error!","data":{}, "error": err})
        }
    }
}