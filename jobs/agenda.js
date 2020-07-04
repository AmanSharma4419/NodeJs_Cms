const Agenda = require('agenda');
const mongoConnectionString = 'mongodb://localhost:27017/'+ constant.DB_NAME;

//declaration of mongo dba and collection
let agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobs'}});

let jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : ['archive-ride'];

//console.log("jobTypes", jobTypes);

// jobTypes.forEach(function(type) {
//   require('./jobs/' + type)(agenda);
// });

if(jobTypes.length) {

  jobTypes.forEach(function(type) {
    //console.log("type", type);
    require('./jobs/' + type.trim())(agenda);
  });

  agenda.on('ready', function() {
    agenda.start();
  });
}

function graceful() {
    agenda.stop(function() {
      process.exit(0);
    });
}
  
process.on('SIGTERM', graceful);
process.on('SIGINT' , graceful);

module.exports = agenda;