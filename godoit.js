var Browser = require("zombie"),
  mongoose = require('mongoose');

function main(){
  var browser = new Browser({ debug: true })
  browser.runScripts = false
  browser.visit("file:///Users/pnmoyano/Downloads/despacho.html", function(){
    processPage(browser);
  });
}

function processPage(browser){
  var paragraphs=browser.querySelectorAll("p");
  var articles=new Array();
  var comision='';
  var expediente='';
  for(parag in paragraphs){
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
  }
  //showArticles(expediente, comision, articles);
  saveAll(expediente, comision, articles);
}

function saveAll(expediente, comision, articles){
  connectToDB("cedom2", expediente, comision, articles, function(db, expediente, comision, articles){
    showArticles(expediente, comision, articles);
    /*var obj=new Object();
    obj['expediente']=expediente;
    obj['comision']=comision;
    obj['articles']=articles;
    writerCallback(obj, db);*/
  });
}

function writerCallback(writeEntity, dbConnection){
  if(writeEntity){
    var entityInstance = new Entity(writeEntity);
    console.log('saving: '+ writeEntity.expediente );
    entityInstance.save(function(){console.log('saved: '+ writeEntity.expediente )});
  }
}

function createEntity(){
  var schemaLocal='{ "expediente" : "String", "comision" : "String", "articles" : ["String"] }';
  var entityTemp=JSON.parse(schemaLocal);
  var entitySchema = mongoose.Schema(entityTemp);
  Entity = mongoose.model("entities", entitySchema);
}


//shows articles, just for debugging purposes
function showArticles(expediente, comision, articles){
  console.log("----Expediente: "+expediente+"----------------");
  console.log("----Comision: "+comision+"----------------");
  for(a in articles){
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log(articles[a]);
  }
}

function connectToDB(dbName, expediente, comision, articles, callback){
  mongoose.connect('mongodb://localhost/'+dbName);
  createEntity();
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  //db.once('open', callback(db, expediente, comision, articles));
  db.once('open', function(db, expediente, comision, articles){callback(db, expediente, comision, articles)});
}

//removes html from text and replaces new lines with a blank space 
function sanitizeText(str){
  if(!str) return str;
  str=str.replace(/<\/?[^>]+(>|$)/g, "");
  str=str.replace(/(\n|\r)/g, " ");
  str=str.trim();
  return str;
}

main();
