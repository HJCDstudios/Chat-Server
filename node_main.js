// Un-comment if not running in DroidScript
	var _OnMessage = function() {};
const parent = {
  "SendMessage":function(msg) {
 		  var MessageParts = msg.split(",");
 		  if (MessageParts[0] == "ReadyToStart") {
 		 	   console.log("Starting Server...");
 		 	  	 _OnMessage("Start,Html,192.168.1.109");
 		 	 } else if (MessageParts[0] == "Started") {
 		 	  	 console.log("Server Started!");
 		 	 } else if (MessageParts[0] == "Log") {
 		 	 	  console.log(MessageParts.slice(1,MessageParts.length).join(","));
 		 	 	}
 		},
 		"SetOnMessage":function(CallBack) {
 		  _OnMessage = CallBack;
 		}
};

const https = require("https");
const fs = require("fs");
const ws = require("ws");
var HttpsServer = null;
var WssServer = null;

function Log(Message, Color = "#000000") {
  parent.SendMessage("Log," + new Date().toJSON() + "," + Color + "," + Message);
}
function OnStart(Params) {
  HttpsServer = https.createServer({
    "cert":fs.readFileSync(Params.Path+"/ssl/cert.pem"),
    "key":fs.readFileSync(Params.Path+"/ssl/key.pem"),
    "passphrase":"1234"
  },function(req,res) {
    var RequestedUrl = req.url;
    var RequestedFile = RequestedUrl.slice(RequestedUrl.lastIndexOf("/") + 1, RequestedUrl.length);
    var RequestedFileExtension = RequestedFile.slice(RequestedFile.lastIndexOf(".") + 1, RequestedFile.length);
    var TheFile = Params.Path + RequestedUrl;
    var TheUnexplainable = "";
    if (RequestedUrl.lastIndexOf("/") + 1 == Params.Path + RequestedUrl.length) TheUnexplainable = RequestedUrl;
    else TheUnexplainable = Params.Path + RequestedUrl + "/";

    console.log( TheFile );
    if (fs.existsSync(TheFile)) {
      if (fs.lstatSync(TheFile).isFile()) {
        res.statusCode = 200;
        
        res.setHeader("Content-Type", Params.FileTypes[RequestedFileExtension]);
        res.end(fs.readFileSync(TheFile));
      } else {
        if (fs.existsSync(TheUnexplainable + "index.html")) {
          res.statusCode = 200;
          res.setHeader("Content-Type","text/html");
          res.end(fs.readFileSync(TheUnexplainable + "index.html"));
        } else {
          res.statusCode = 403;
          res.end("Cannot list directories");
        }
      }
    } else {
      res.statusCode = 404;
      res.end("File: " + RequestedFile + " does not exist");
    }
  });
  
  WssServer = new ws.WebSocketServer({ "server":HttpsServer });
  WssServer.on("connection", function(ws1) {
    ws1.on("message", function(data,isbin) {
      var ParsedData;
      try {
        ParsedData = JSON.parse(data);
      } catch(e) {
        return;
      }
      if (ParsedData.Type == "Join") Log(ParsedData.From.Name + " Joined","#00ff00");
      else if (ParsedData.Type == "Quit") Log(ParsedData.From.Name + " Quitted", "#ff0000");
      else if (ParsedData.Type == "Call") Log(ParsedData.From.Name + " Called " + ParsedData.To);
      else if (ParsedData.Type == "Decline") Log(ParsedData.To + "'s Call to " + ParsedData.From.Name + " was declined", "#ff0000");
      else if (ParsedData.Type == "Accept") Log(ParsedData.To + "'s Call to " + ParsedData.From.Name + " was accepted", "#00ff00");
      else if (ParsedData.Type == "Message") Log(ParsedData.To + " sent a message to " + (ParsedData.To ? ParsedData.To : "everyone"));
      else if (ParsedData.Type == "ChangeName") Log(ParsedData.From.Name + " changed it's name to " + ParsedData.Name);
      else Log("none");
      
      var NumberOfClients = 0;
      WssServer.clients.forEach(function(client) {
        if (client !== ws1 && client.readyState == ws.WebSocket.OPEN) {
          NumberOfClients++;
          client.send(data,{"binary":isbin});
        }
      });
      Log("sent to: "+NumberOfClients);
    });
  });
  
  HttpsServer.listen(8275,Params.HostName);
  parent.SendMessage("Started");
}

parent.SetOnMessage(function(Message) {
  var MessageParts = Message.split(",");
  if (MessageParts[0] == "Start") {
    OnStart({
      "Path":MessageParts[1],
      "FileTypes":{
        "js":"text/javascript",
        "css":"text/css",
        "scss":"text/x-scss",
        "html":"text/html",
        "htm":"text/html",
        "txt":"text/plain",
        "map":"application/octet-stream",
        "woff":"font/woff",
        "woff2":"font/woff2",
        "eot":"application/vnd.ms-fontobject",
        "ttf":"font/ttf",
        "svg":"image/svg+html",
        "yml":"application/octet-stream",
        "less":"application/octet-stream",
        "json":"application/json",
        "pem":"text/plain",
        "wav":"audio/x-wav",
        "ico":"image/png",
        "mp4":"video/mp4"
      },
      "HostName":MessageParts[2] != "null" ? MessageParts[2] : undefined
    });
  } else if (MessageParts[0] == "Message") {
    var NumberOfClients = 0;
    WssServer.clients.forEach(function(client) {
      if (client.readyState == ws.WebSocket.OPEN) {
        NumberOfClients++;
        client.send(JSON.stringify({
          "Type":"Message",
          "Message":MessageParts.slice(2, MessageParts.length).join(","),
          "From":{
            "Name":"Server",
            "ID":MessageParts[1]
          }
        }),{"binary":false});
      }
    });
    parent.SendMessage("MessageSent," + NumberOfClients);
  }
});
parent.SendMessage("ReadyToStart");
