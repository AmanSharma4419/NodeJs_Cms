var User = require('../../models/usertable.js');


module.exports = function(agenda) {
    // defining the archive ride for the jobs in collection
    agenda.define('register ride', function(job, done) {
        // user to register for ride
        User.register({id: job.attrs.data.rideId},()=>{})
        done();
    });

};