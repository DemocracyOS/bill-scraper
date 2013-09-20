/**
 * Module dependencies.
 */

var mongoose = require('mongoose');

var EntitySchema = mongoose.Schema({
    expediente: { type: String, required: true }
  , comision: { type: String, required: true }
  , articles: [{ type: String, default: []}]
});

module.exports = function db(dbname) {
  mongoose.connect('mongodb://localhost/' + dbname);
  mongoose.model('Entity', EntitySchema);
  return mongoose;
}
