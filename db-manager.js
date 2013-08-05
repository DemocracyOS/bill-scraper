var mongoose = require("mongoose"),
  // config = require("./dbconifg.json"),
  config = {
    dbName: "cedom"
  },
  // actSchema = require("./cedomactschema.json");
  actSchema = {        // ley
    number: Number,       // número
    ratification: String, // fecha sanción
    promulgation: {       // promulgación
      date: Date,         // fecha
      doc: String         // documento (decreto, etc.)
    },
    publication: {        // publicación
      date: Date,         // fecha
      doc: String         // documento (decreto, etc.)
    },
    body: String,         // cuerpo (capítulos, artículos, etc.)
    signatures: [{        // firmas
      signature: String   // firma
    }]
  };

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

// connects to a database by name, callback is called with new CedomConnection
function connectToDB(dbName, callback) {
  mongoose.connect("mongodb://localhost/" + dbName);

  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", function() {
    callback(new CedomConnection());
  });
}

// connect to cedom database, callback gets a CedomConnection
exports.connect = function (callback) {
  connectToDB(config.dbName, callback);
};
