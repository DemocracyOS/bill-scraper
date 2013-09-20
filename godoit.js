/**
 * Module dependencies.
 */

var db = require('./db')('cedom');
var Entity = db.model('Entity');

var connection = db.connection;
connection.on('error', console.error.bind(console, 'connection error:'));

var Browser = require("zombie");
var visitOptions = { runScripts: false, loadCSS: false, debug: true, silent: true };
Browser.visit("file:///Users/pnmoyano/Downloads/despacho.html", visitOptions, ready);

/**
 * Callback for browser `ready` state
 *
 * @requires `sanitizeText` function globally defined
 * @requires `saveAll` function globally defined
 * @api private
 */

function ready(err, browser) {
  if (err) {
    console.log('Found error: %s', err);
    return process.exit(1);
  };

  var paragraphs = browser.querySelectorAll("p");
  var articles = [];
  var comision = '';
  var expediente = '';

  for(parag in paragraphs) {
    var thisParag=sanitizeText(paragraphs[parag].innerHTML);
    //if this is an empty paragraph, ignore it
    if(!thisParag || thisParag.trim()==""){
      continue;
    }
    if(thisParag.substr(0,15)=="Sala de la Comi"){ //this text tell us there are no more articles
      break;
    }else if(thisParag.substr(0,15)=="El Expediente N"){
      expediente=thisParag.substr(17,100);
      expediente=expediente.substr(0, expediente.search(' de autor'));
    }else if(thisParag.substr(0,15)=="Por lo expuesto"){
      comision=thisParag.substr(34,100);
      comision=comision.substr(0, comision.search(' aconseja'));
    }else if(thisParag.substr(0,3)=="Art"){ //if an Article is starting
      articles.push(thisParag);
    }else{
      //if there is at least one article, add the text to the last of them
      if(articles.length>0){
        articles[articles.length-1]=articles[articles.length-1]+"\n"+thisParag;
      }
    }
  };
  //showArticles(expediente, comision, articles);
  saveAll(expediente, comision, articles);
}

/**
 * Persist parsed document to database
 *
 * @param {String} expediente
 * @param {String} comision
 * @param {Array} articles
 * @requires `connection` MongoDB connection globally defined
 * @requires `Entity` Mongoose model globally defined
 * @requires `showArticles` function globally defined
 * @api private
 */

function saveAll(expediente, comision, articles) {
  connection.once('open', function() {
    showArticles(expediente, comision, articles);

    // Creating an `Entity` instance
    var entity = new Entity({
      expediente: expediente,
      comision: comision,
      articles: articles
    });

    // log
    console.log('saving:', entity.expediente);

    // Saving entity instance
    entity.save(function(err) {
      if (err) {
        console.log('found error: %j', err);
      } else {
        console.log('saved: %s', entity.expediente);
      }
    })
  });
}

/**
 * Prints articles, just for debugging purposes
 *
 * @param {String} expediente
 * @param {String} comision
 * @param {Array} articles
 * @api private
 */

function showArticles(expediente, comision, articles){
  console.log("----Expediente: " + expediente + "----------------");
  console.log("----Comision: " + comision + "----------------");
  for(a in articles){
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log(articles[a]);
  }
}

/**
 * Remove html from text and replaces new lines with a blank space
 *
 * @param {String} str
 * @return {String} sanitized string
 * @api private
 */

function sanitizeText(str){
  if(!str) return str;
  str=str.replace(/<\/?[^>]+(>|$)/g, "");
  str=str.replace(/(\n|\r)/g, " ");
  str=str.trim();
  return str;
}