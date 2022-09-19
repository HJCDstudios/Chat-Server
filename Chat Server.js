cfg.Light;
const pkg = "com.HJCD.ChatServer";
var AppLayout,
  InfoText,
  BackgroundService,
  BtnSendMessage,
  BtnShowLogs,
  ExitDialog,
  TextEditMessage;
var Logs = app.LoadText("Logs","",pkg);

function OnStart() {
  app.EnableBackKey(false);
  app.PreventWifiSleep();
  app.SetOrientation("Portrait");
  
  ExitDialog = app.CreateYesNoDialog("Close the server and kill the app?");
  ExitDialog.SetOnTouch(function(Result) {
    if (Result == "Yes") app.Exit(true);
  });
  
  AppLayout = app.CreateLayout("Linear", "VCenter,FillXY");
  
  InfoText = app.AddText(AppLayout, "Loading...", 0.8, -1, "MultiLine");
	InfoText.SetTextSize(20);
	
	TextEditMessage = app.AddTextEdit(AppLayout, "", 0.8, null, "Multiline,Left");
	TextEditMessage.SetHint("Message To Be Sent");
	TextEditMessage.SetMargins(0,0.1,0,0);
	
	BtnSendMessage = app.AddButton(AppLayout, "Send Message To All Users", 0.8);
	BtnSendMessage.Hide();
	
	BtnShowLogs = app.AddButton(AppLayout, "Show Logs", 0.8);
	BtnShowLogs.SetOnTouch(ShowLogs);
	BtnShowLogs.Hide();
	
	BtnClearLogs = app.AddButton(AppLayout, "Clear Logs", 0.8);
	BtnClearLogs.SetOnTouch(function() {
	  Logs = "";
	  app.SaveText("Logs","",pkg);
	});
	
	app.AddLayout(AppLayout);
	
  NodeJS = app.CreateNode();
  NodeJS.SetOnReady(NodeJSReady);
  NodeJS.SetOnMessage(NodeJSOnMessage);
}
function OnBack() {
  ExitDialog.Show();
}

function NodeJSReady() {
  NodeJS.Run("node_main.js");
}
function NodeJSOnMessage(msg) {
  msg = eval(msg);
  msg = msg.split(",");
  if (msg[0] == "ReadyToStart") {
    app.ShowPopup("Server is starting","Bottom,Short");
    NodeJS.SendMessage("Start,Html," + app.GetIPAddress());
  } else if (msg[0] == "Started") {
    app.ShowPopup("Server Started Successfully","Bottom");
    InfoText.SetText("Type the following address into a browser to access the Chat Server\nPlease ignore the ssl error\n\nhttps://" + app.GetIPAddress() + ":8275");
    BtnSendMessage.SetOnTouch(function() {
      if (TextEditMessage.GetText().trim().length == 0) return app.ShowPopup("Message cannot be blank","Bottom,Short");
      if (TextEditMessage.GetText().length > 1024) return app.ShowPopup("Message is too long, Must be less than 1025","Bottom");
      
      NodeJS.SendMessage("Message," + new Date().toJSON() + "," + TextEditMessage.GetText());
    });
    BtnSendMessage.Show();
    BtnShowLogs.Show();
  } else if (msg[0] == "MessageSent") {
    app.ShowPopup("Message Sent To " + msg[1] + " user" + (parseInt(msg[1]) > 1 ? "s" : ""),"Bottom,Short");
  } else if (msg[0] == "Log") {
    var d = new Date(msg[1]);
    Logs += "<b>" + (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " - "
      + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "</b>:<br/>" +
      "<font color=\"" + msg[2] + "\">" + msg.slice(3,msg.length) + "</font><br/>";
    app.SaveText("Logs",Logs,pkg);
  }
}
function ShowLogs() {
  var LogDialog = app.CreateDialog("Logs");
  LogDialog.SetSize(0.8, 0.8);
  
  var LogDialogLayout = app.CreateLayout("Linear", "VCenter");
  
  var LogViewer = app.AddWebView(LogDialogLayout, 0.7, 0.7, "IgnoreErrors");
  LogViewer.LoadHtml(Logs);

  LogDialog.AddLayout(LogDialogLayout);
  LogDialog.Show();
}