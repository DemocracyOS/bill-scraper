var http = require("http");
var util = require("util");
var fs = require('fs')

//global variables
var programName=undefined;
var mode=undefined;
var hostname=undefined;
var pathname=undefined;
var startIndex=undefined; 
var endIndex=undefined; 

main();

function main(){
  readParams();
  processLinks(startIndex);
}

function readParams(){
  process.argv.forEach(function (val, index, array) {
    if(index==1){
      programName=val;
    }
    if(index==2){
      mode=val;
    }
    if(mode=="-e"){
      if(index==3){
        hostname=val;
      }
      if(index==4){
        pathname=val;
      }
      if(index==5){
        startIndex=val;
      }
      if(index==6){
        endIndex=val;
      }
    }
  });
  if(!mode || mode!="-e"){
    console.log("Usage: node "+programName+" -h");
    console.log("            shows this message");
    console.log("");
    console.log("       node "+programName+" -i hostname pathname startIndex endIndex");
  }
  if(mode=="-e"){
      if(!hostname){
        console.log("Please define Hostname");
        process.exit(1);
      }
      if(!pathname){
        console.log("Please define Pathname");
        process.exit(1);
      }
      if(pathname.indexOf('#1')<0){
        console.log("Please define a Pathname with '#1' inside it");
        process.exit(1);
      }
      if(!startIndex){
        console.log("Please define Start Index");
        process.exit(1);
      }
  }
}

function processLinks(lastUsedIndex){
  if(lastUsedIndex>endIndex){
    return;
  }else{
    var newPathname=pathname.replace("\#1", lastUsedIndex);
    var thisLink=hostname+newPathname;
    console.log("processing: "+thisLink);
    lastUsedIndex++;
    traerPag(hostname, newPathname, lastUsedIndex);
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
