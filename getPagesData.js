var http = require("http");
var util = require("util");
var fs = require('fs')
var argv = require('optimist')
    .usage(
        'Usage1: $0 -t json_structure -h hostname [-p path] [-s start_index] [-e end_index]\n'+
        '\n'+
        '')
    .default({ p : '', s : 0 })
    .demand(['t'])
    .demand(['h'])
    .describe('t', 'Json file with the structure to parse (ie.: ./config.json)')
    .describe('h', 'Hostname to connect to (ie.: www.google.com)')
    .describe('p', 'Path in the host, include "#1" to replace for an index (ie.: /docs/law#1.html)')
    .describe('s', 'Starting index for auto generated urls (ie.: 200)')
    .describe('e', 'End index for auto generated urls (ie.: 210)')
    .argv;
var structure = undefined;

main();

function main(){
  checkParams();
  readStructure();
  processLinks(argv.s);
}

function checkParams(){
  //ToDo: when parameters logic is more complex, add here a validation logic to tell the user 
  //what's wrong with them and to check consistency 
}

function readStructure(){
  structure = require(argv.t);
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
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
          content += chunk;
      });
      res.on("end", function (sss) {
        if(res.statusCode==200){
          getJsonFromString(content);
          processLinks(lastUsedIndex);
        }else{
          console.log("Page not found");
        }
      });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function getJsonFromString(cadena){
  for(token in structure.structure){
    if(structure.structure[token].array=="true"){
      var regexp1 = new RegExp(structure.structure[token].regex, "g");
      var  paragraph = cadena.match(regexp1);
      var regexp2 = new RegExp(structure.structure[token].internal_regex);
      for(parag in paragraph){
        var thisPart= getScrapped(paragraph[parag], regexp2, structure.structure[token].regex_part);
        console.log(structure.structure[token].description+": "+thisPart);
      }
    }else{
      console.log(structure.structure[token].description+
        getScrapped(cadena, structure.structure[token].regex, structure.structure[token].regex_part));
    }
  }
}

function getScrapped(fullString, re, partToKeep){
  if(partToKeep==undefined) partToKeep=1;
  var rePattern = new RegExp(re);
  var results = fullString.match(rePattern);
  if(!results) return null;
  return results[partToKeep];
}
