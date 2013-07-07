var http = require("http");
var util = require("util");
var fs = require('fs')
var argv = require('optimist')
    .usage(
        'Usage1: $0 -h hostname [-p path] [-s start_index] [-e end_index]\n'+
        '\n'+
        '')
    .default({ p : '', s : 0 })
    .demand(['h'])
    .describe('h', 'Hostname to connect to (ie.: www.google.com)')
    .describe('p', 'Path in the host, include "#1" to replace for an index (ie.: /docs/law#1.html)')
    .describe('s', 'Starting index for auto generated urls (ie.: 200)')
    .describe('e', 'End index for auto generated urls (ie.: 210)')
    .argv;

main();

function main(){
  checkParams();
  processLinks(argv.s);
}

function checkParams(){
  //ToDo: when parameters logic is more complex, add here a validation logic to tell the user 
  //what's wrong with them and to check consistency 
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
  var sancion=getScrapped(cadena, /.*Sanci&oacute;n: (\d{1,2}\/\d{1,2}\/\d{4})(.*)/);
  console.log("Sancion: "+sancion);
  var publicacion=getScrapped(cadena, /.*Publicaci&oacute;n: (.*)<(.*)/);
  console.log("Publicacion: "+publicacion);
  var promulgacion=getScrapped(cadena, /.*Promulgaci&oacute;n: (.*)<(.*)/);
  console.log("Promulgacion: "+promulgacion);
  
  var arts = cadena.match(/.*Art&iacute;culo \d{1,2}(.*)-(.*)/g);
  for(aa in arts){
    var articuloAca = getScrapped(arts[aa], /.*Art&iacute;culo(.*)-(.*)/, 2);
    console.log("Art "+aa+": "+articuloAca);
  }
}

function getScrapped(cadena, re, cual){
  if(cual==undefined) cual=1;
  var rePattern = new RegExp(re);
  var resultados = cadena.match(rePattern);
  if(!resultados) return null;
  return resultados[cual];
}
