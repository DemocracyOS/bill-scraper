var mongoose = require("mongoose");

var config = require("./dbconifg.json"),
  actSchema = require("./cedomactschema.json");

// constructor to manage acts on the database
function CedomConnection() {
  var actsSchema = mongoose.Schema(actSchema);
  this.Act = mongoose.model("acts", actsSchema);
}

// save an act
CedomConnection.prototype.saveAct = function (actData, callback) {
  var act = new this.Act(actData);
  act.save(callback);
};

// connect to cedom database, callback gets a CedomConnection
exports.connect = function (callback) {
  mongoose.connect("mongodb://localhost/" + config.dbName);
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function() {
    callback(new CedomConnection());
  });
};
