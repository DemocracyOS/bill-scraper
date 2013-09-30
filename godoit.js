/**
 * Module dependencies.
 */

var db = require('./db')('cedom');
var Entity = db.model('Entity');

var connection = db.connection;
connection.on('error', console.error.bind(console, 'connection error:'));

var Browser = require("zombie");
var visitOptions = { runScripts: false, loadCSS: false, debug: true, silent: true };
var docUrl = "file://" + process.argv[2];
Browser.visit(docUrl, visitOptions, ready);

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
  // Sample phrases mentioning expediente number
  // - El Expediente Nº 2059-D-2012 y agreg. 2882-J-2012 de autoría de los Diputados Enzo Pagani, Lidia Saya, María Karina Spalla y del Sr. Jefe de Gobierno
  // - El Expediente Nº 1222-O-2012, de autoría de 
  // - El expedinete N° 099-D-2012 del Diputado Ocampo Martin y otros de Ley, donde se solicita la Obligatoriedad de informar en forma previa en los cajeros automáticos el costo de 
  // - El expediente N° 0305-D-2012, de Declaración, de la Diputada Morales Gorleri, referido a la preocupación 
  // - El Expediente Nº 147-D-2012, de Declaración, de autoría de los Diputados Claudio Presman
  // - El Expediente Nº  180-D-2012 Proyecto de Resolución de los diputados Rubén Campos y Claudio Presman  y
  // - El expediente 674-D-2012 de autoría del Diputado Adrián R. 
  // - El expediente N° 0296-D-2011 del Diputado Ocampo y otros de Ley
  // - El Expediente Nº 1964-D-2011 iniciado por la Diputada Carmen Polledo quien propicia declarar Ciudadano Ilustre al actor, di
  // - El Expediente 1286-D-2012 de ley, de autoría de los Diputados Presman, Claudio y Campos, Rubén
  // - Que el Expediente, 005-D-12, de autoría de la Diputada Maria Elena Naddeo, proyecto de declaración por el que exhorta q
  // - El Expte. N° 389-D-2012, propiciado por los Sres. Diputados Claudio Presman y Rubén Campos por medio del cual solicitan gestiones ante la 
  // - El Expediente 2112-D-2012 de ley, de autoría del Diputado
  var expedienteIdentifierRegExp = /^(?:&nbsp;)*(?:que )*el (?:expediente|expte|expedinete).{1,4}([0-9]{3,4}\-.\-[0-9]{2,4})(?: |,)/i;  


  for(parag in paragraphs) {
    var thisParag=sanitizeText(paragraphs[parag].innerHTML);
    //if this is an empty paragraph, ignore it
    if(!thisParag || thisParag.trim()==""){
      continue;
    }
    if(thisParag.substr(0,15)=="Sala de la Comi"){ //this text tell us there are no more articles
      break;
    }else if(expedienteIdentifierRegExp.test(thisParag)){
      expediente = expedienteIdentifierRegExp.exec(thisParag)[1];
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