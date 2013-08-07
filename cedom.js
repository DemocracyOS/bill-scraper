var request = require("request");

// var config = require("./cedomonfig.json");
var config = {
  cedomHost: "http://www.cedom.gov.ar",
  actPath: "/es/legislacion/normas/leyes/ley{actNum}.html"
};

// gets all act numbers from the CEDOM
// returns an array of act numbers
exports.getAllActsNums = function (callback) {
  //
};

// gets an act from the CEDOM
// returns a JSON representation of the act
exports.getAct = function (actNum, callback) {
  var url, $,
    actData = {};

  if (!(/^\d+$/.test("" + actNum))) {
    return callback(new Error("Invalid act number"));
  }
  actData.meta = {
    number: actNum
  };
  url = config.cedomHost + config.actPath.replace("{actNum}", actNum);
  request.get(url, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback(error || new Error("HTTP error " + response.statusCode));
    }

    // test - replace by htmlscraper/parsehtml
    actData = body;

    callback(null, actData);
  });

};
