module.exports = function (http, app) {
  var io = require("socket.io")(http);
  const redisAdapter = require("socket.io-redis");
  io.adapter(redisAdapter({ host: "localhost", port: 6379 }));
  app.set("socketio", io);

  var User = require("../models/userTable");
  var Driver = require("../models/drivertable");
  var Chat = require("../models/chatTable");
  var Message = require("../models/chatHistory");

  //all socket listent request
  io.on("connection", function (socket) {
    require("./customerSocket")(socket);
    require("./driverSocket")(socket);

    socket.on("sendMessage", function (data, acknowledgement) {
      Chat.addChat(data, async (err, chatdata) => {
        if (err) {
          var messageData = {
            success: false,
            msg: data.msg,
            customerId: null,
            driverId: null,
            chatId: null,
            byCustomer: data.byCustomer,
            byDriver: data.byDriver,
          };
          acknowledgement(messageData);
        } else {
          var SendToCustomer = await User.getUserByIdAsync(chatdata.customerId);
          console.log("Customer", SendToCustomer);
          var messageData = {
            msg: data.msg,
            customerId: chatdata.customerId,
            driverId: chatdata.driverId,
            chatId: chatdata._id,
            byCustomer: data.byCustomer,
            byDriver: data.byDriver,
          };
          if (SendToCustomer != null) {
            io.sockets
              .to(SendToCustomer.socketId)
              .emit("newMessage", messageData);
            /*if (SendToCustomer.offline === "no") {
                    io.sockets.to(SendToCustomer.socketId).emit("newMessage", messageData);
                  } else {
                    if (SendToCustomer.firebaseToken != null) {
                      var registrationToken = SendToCustomer.firebaseToken;
                      var payload = {
                        notification: {
                          title: 'New Message!',
                          body: "New Message!!"
                        },
                        data: { "chatId": chatdata._id.toString(), "driverId": chatdata.driverId.toString(),type:'chat' }
                      }
                      admin.messaging().sendToDevice(registrationToken, payload)
                        .then((response) => {
                          console.log('New message Successfully sent message:', response);
                        })
                        .catch((error) => {
                          console.log('New Message Error sending message:', error);
                        });
                    }
                    customerUnreadMessages = chatdata.customerUnreadMessages + 1;
                  }*/
          }
          var SendToDriver = await Driver.findDriverByIdAsync(
            chatdata.driverId
          );
          console.log("Driver", SendToDriver);
          if (SendToDriver != null) {
            io.to(SendToDriver.socketId).emit("newMessage", messageData);
            /*if (SendToDriver.offline === "no") {
                    io.to(SendToDriver.socketId).emit("newMessage", messageData);
                  } else {
                    if (SendToDriver.firebaseToken != null) {
                      var registrationToken = SendToDriver.firebaseToken;
                      var payload = {
                        notification: {
                          title: 'New Message!',
                          body: "New Message!!"
                        },
                        data: { "chatId": chatdata._id.toString(), "customerId": chatdata.customerId.toString(),type:'chat' }
                      }
                      var driverFDB = app.get("driverFDB");
                      admin.messaging(driverFDB).sendToDevice(registrationToken, payload)
                        .then((response) => {
                          console.log('New message Successfully sent message:', response);
                        })
                        .catch((error) => {
                          console.log('New Message Error sending message:', error);
                        });
                    }
                    driverUnreadMessages = chatdata.driverUnreadMessages + 1;
                  }*/
          }
          Message.addMessage(messageData, (err, resdata) => {
            if (err || resdata == null) {
              console.log("resdata err", err);
            } else {
              console.log("resdata success", resdata);
            }
          });
        }
      });
    });

    socket.on("disconnect", function (reason) {
      //console.log("Reason Disconnect", reason);
      //console.log('A user disconnected ' + socket.type);

      if (socket.type === "customer") {
        User.removeSocketCustomer(socket.id, (err, call) => {
          if (err) {
            //console.log("customer socket error");
          }
          //console.log("call", call);
        });
      }

      if (socket.type === "driver") {
        try {
          Driver.removeSocketDriver(socket.id, (err, call) => {
            if (err) {
              //console.log("Driverd socket error");
            }
          });
        } catch (err) {}
      }
    });
  });
};
