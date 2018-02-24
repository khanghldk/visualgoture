var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

app.get("/", (req, res) => res.send("Deployed!"));

app.get("/webhook", function (req, res) {
    if (req.query["hub.verify_token"] === process.env.VERIFICATION_TOKEN) {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
    	console.log(req.query["hub.verify_token"]);
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
});

app.post("/webhook", function (req, res) {
  // Make sure this is a page subscription

  	//console.log("body: " + JSON.stringify(req.body));

  	if (req.body.object == "page") {
	    
  		req.body.entry.forEach(function(entry) {

      		entry.messaging.forEach(function(event) {
        		if (event.postback) {
          			processPostback(event);
        		}
      		});
    	});

    	res.sendStatus(200);

  	}	
});

function processPostback(event) {
  var senderId = event.sender.id;
  var payload = event.postback.payload;

  if (payload === "Greeting") {
    // Get user's first name from the User Profile API
    // and include it in the greeting
    request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      console.log("userID: " + senderId);
      var message = greeting + "I have sent message to you!";
      sendMessage(senderId, {text: message});
      senderId = 100002758278639;
      sendMessage(senderId, {text: message});
    });
  }
}

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}