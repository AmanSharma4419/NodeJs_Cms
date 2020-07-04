//required module
const express = require("express");
const i18n = require("./i18n");
const bodyParser = require("body-parser");
const crypto = require("crypto"),
  shasum = crypto.createHash("sha256");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const sticky = require("sticky-session");
const cluster = require("cluster");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
admin = require("firebase-admin");
app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
require("dotenv").config();
app.use(i18n);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/public", express.static(__dirname + "/public"));

//////////////// port define /////////////////////////////////////
app.set("port", process.env.PORT || 5004);
// socket
const http = require("http").createServer(app);

//{ pingInterval: 2000, pingTimeout: 60000, upgradeTimeout: 30000 }
//var console = require('./console');
constant = require("./helper/constants");
helper = require("./helper/helper");

//all socket
require("./socket/socket")(http, app);

if (!sticky.listen(http, app.get("port"))) {
  http.once("listening", function () {
    console.log("Server started on port " + app.get("port"));
  });

  if (cluster.isMaster) {
    var numWorkers = require("os").cpus().length;

    //console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for (var i = 0; i < numWorkers; i++) {
      cluster.fork();
    }
    //console.log('Main server started on port ' + app.get('port'));

    cluster.on("online", function (worker) {
      console.log("Worker " + worker.process.pid + " is online");
    });
  }
} else {
  //console.log('- Child server started on port ' + app.get('port') + ' case worker id=' + cluster.worker.id);
}

//****Database connection mongodb using mongoose */
mongoose.connect("mongodb://localhost/" + constant.DB_NAME, {
  useCreateIndex: true,
  useFindAndModify: false,
  useNewUrlParser: true,
});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function callback() {
  console.log("Db Connected");
});

//firebase
require("./firebase/firebaseMain")(app);

//all routes
require("./routes/mainRoutes")(app);
