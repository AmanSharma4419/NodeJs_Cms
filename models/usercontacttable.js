var mongoose = require('mongoose');

var ContactSchema = mongoose.Schema({
    userId: { type: String },
    name: { type: String },
    contactNumber: { type: String },
    createdAt: { type: Date },
    countryCode: { type: String }
},
    {
        versionKey: false // You should be aware of the outcome after set to false
    });

const Contact = module.exports = mongoose.model('Contact', ContactSchema);


//add contact 
module.exports.addContact = function (contact, callback) {
    contact.createdAt = new Date();
    var str = contact.contactNumber.trim();
    var split1 = contact.contactNumber.trim().substring(0, 3);
    var split2 = contact.contactNumber.trim().substring(0, 2);

    if (split1 == '+91') {
        contact.contactNumber = contact.contactNumber.substring(3, str.length);
        contact.countryCode = '91';
    }

    if (split2 == '+1') {
        contact.contactNumber = contact.contactNumber.substring(2, str.length);
        contact.countryCode = '1';
    }

    Contact.create(contact, callback);
}

//get contact by userID
module.exports.getContactByUserId = function (userId, callback) {
    var where = { userId: userId }
    return Contact.find(where, callback);
}

module.exports.getContactByUserIdCallback = function (userId, callback) {
    var where = { userId: userId }
    Contact.find(where, callback);
}

//
module.exports.searchForContact = function (data) {
    var where = { userId: data.userId, contactNumber: data.contactNumber }
    return Contact.find(where);
}


//remove contact
module.exports.removeContact = (id, callback) => {
    var query = { _id: id };
    Contact.remove(query, callback);
}