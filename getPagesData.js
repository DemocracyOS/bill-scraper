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
console.log(dataToSave);
  var entityInstance = new Entity(JSON.parse(dataToSave));
  entityInstance.save(function(){console.log('saved')});
}

function sanitizeString(str){
  return str==null?null:str.replace('"', '');
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
  if(lastUsedIndex>argv.e){
    return;
  }else{
    var newPathname=argv.p.replace("\#1", lastUsedIndex);
    var thisLink=argv.h+newPathname;
    console.log("processing: "+thisLink);
    lastUsedIndex++;
    traerPag(argv.h, newPathname, lastUsedIndex);
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

function getJsonFromString(cadena){
  var retVal="";
  retVal+="{";
  var firstToken=true;
  for(token in structure.structure){
    if(firstToken){
      firstToken=false;
    }else{
      retVal+=", ";
    }
    if(structure.many){
      var arrayRetVal=new Array();
      var regexp1 = new RegExp(structure.structure[token].regex, "g");
      var paragraph = cadena.match(regexp1);
      var regexp2 = new RegExp(structure.structure[token].regex);
      for(parag in paragraph){
        var thisPart= getScrapped(paragraph[parag], regexp2, structure.structure[token].regex_part);
        var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(thisPart)
        arrayRetVal.push('{"'+structure.structure[token].dbField+'": "'+thisFullPart+'"}');
      }
    }else if(structure.structure[token].array=="true"){
      var regexp1 = new RegExp(structure.structure[token].regex, "g");
      var paragraph = cadena.match(regexp1);
      var regexp2 = new RegExp(structure.structure[token].internal_regex);
      var firstInternalToken=true;
      retVal+='"'+structure.structure[token].dbField+'": [';
      for(parag in paragraph){
        if(firstInternalToken){
          firstInternalToken=false;
        }else{
          retVal+=", ";
        }
        var thisPart= getScrapped(paragraph[parag], regexp2, structure.structure[token].regex_part);
        var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(thisPart)
        retVal+='{"'+structure.structure[token].internal_dbField+'": "'+thisFullPart+'"}';
      }
      retVal+="]";
    }else{
      var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(getScrapped(cadena, structure.structure[token].regex, structure.structure[token].regex_part));
      retVal+='"'+structure.structure[token].dbField+'": "'+thisFullPart+'"';
    }
  }
  retVal+="}";
  return structure?arrayRetVal:retVal;
}

function getScrapped(fullString, re, partToKeep){
  if(partToKeep==undefined) partToKeep=1;
  var rePattern = new RegExp(re);
  var results = fullString.match(rePattern);
  if(!results) return null;
  return results[partToKeep];
}
