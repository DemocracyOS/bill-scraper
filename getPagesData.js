var http = require("http");
var util = require("util");
var fs = require('fs')
var Entity; 
var argv = require('optimist')
    .usage(
        'Usage1: $0 -t json_structure -h hostname [-p path] [-s start_index] [-e end_index]\n'+
        '\n'+
        '')
    .default({ p : '', s : 0 })
    .demand(['t'])
    .demand(['h'])
    .demand(['d'])
    .demand(['b'])
    .describe('t', 'Json file with the structure to parse (ie.: ./config.json)')
    .describe('d', 'Database name (ie.: scrapper)')
    .describe('b', 'DB Schema to write to (ie.: laws)')
    .describe('h', 'Hostname to connect to (ie.: www.google.com)')
    .describe('p', 'Path in the host, include "#1" to replace for an index (ie.: /docs/law#1.html)')
    .describe('s', 'Starting index for auto generated urls (ie.: 200)')
    .describe('e', 'End index for auto generated urls (ie.: 210)')
    .describe('o', 'DB Schema to read links from (ie: links)')
    .describe('a', 'DB attribute to read links from (ie: url)')
    .argv;
var structure = undefined;
var mongoose = undefined;
var db= undefined;
var linkList;

main();

function connectToDB(schema){
  mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost/'+argv.d);
  createEntity(schema);
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    processLinks(argv.s);
  });
}

function createEntity(schemaLocal){
  var entityTemp=JSON.parse(schemaLocal);
  var entitySchema = mongoose.Schema(entityTemp);
  Entity = mongoose.model(argv.b, entitySchema);
}

function writeEntity(dataToSave){
  var entityInstance = new Entity(JSON.parse(dataToSave));
  entityInstance.save(function(){console.log('saved')});
}

function main(){
  checkParams();
  structure = readStructure();
  var schema = createDBSchema(structure);
  connectToDB(schema);
}

function checkParams(){
  //ToDo: when parameters logic is more complex, add here a validation logic to tell the user 
  //what's wrong with them and to check consistency 
}

function createDBSchema(sourceStructure){
  var jsonSchema="{";
  var isFirst=true;
  for(token in sourceStructure.structure){
    if(isFirst){
      isFirst=false;
    }else{
      jsonSchema+=",";
    }
    if(structure.structure[token].array=="true"){
      jsonSchema+='"'+sourceStructure.structure[token].dbField+'"'+":";
      jsonSchema+="["+'"'+sourceStructure.structure[token].dbFieldType+'"'+"]";
    }else{
      jsonSchema+='"'+sourceStructure.structure[token].dbField+'"'+":";
      jsonSchema+='"'+sourceStructure.structure[token].dbFieldType+'"';
    }
  }
  jsonSchema+="}";
  return jsonSchema;
}

function readStructure(){
  return require(argv.t);
}

function processLinks(lastUsedIndex){
  if(argv.p){
    if(lastUsedIndex>argv.e){
      return;
    }else{
      var newPathname=argv.p.replace("\#1", lastUsedIndex);
      var thisLink=argv.h+newPathname;
      console.log("processing: "+thisLink);
      lastUsedIndex++;
      traerPag(argv.h, newPathname, lastUsedIndex);
    }
  }else{
    if(linkList){
      traerPag(argv.h, linkList[lastUsedIndex], lastUsedIndex);
    }else{
      readLinksFromDB();
    }
  }
}

function createiInputEntity(){
  var schemaLocal='{"'+argv.a+'"}';
  var entityTemp=JSON.parse(schemaLocal);
  var entitySchema = mongoose.Schema(entityTemp);
  inputEntity = mongoose.model(argv.o, entitySchema);
}

function readLinksFromDB(){
  var originCollection=mongoose.db(argv.a);
  var linkList=originCollection.find();
  for(linkI in linkList){
    console.log(linkList[linkI]);
  }
}

function traerPag(host, path, lastUsedIndex){
  var options = {
    host: host,
    port: 80,
    path: path
  };
  
  var content="";
  http.get(options, function(res) {
    return manageHttpResponse(res, lastUsedIndex, content);
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function manageHttpResponse(res,  lastUsedIndex, content){
  res.setEncoding("utf8");
  res.on("data", function (chunk) {
      content += chunk;
  });
  res.on("end", function (sss) {
    if(res.statusCode==200){
      var localContent=getJsonFromString(content);
      if(localContent instanceof Array){
        for(var cont in localContent){ 
          writeEntity(localContent[cont]);
        }
      }else{
        writeEntity(localContent);
      }
      processLinks(lastUsedIndex);
    }else{
      console.log("Page not found");
    }
  });
}

