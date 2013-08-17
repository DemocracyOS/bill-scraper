var request = require('request'),
  Iconv  = require('iconv').Iconv,
  ent = require('ent'),
  parse = require('./parseHtml'),
  http = require('http'),
  mongoose = require('mongoose');


var dbConnection=connectToDB("cedom1", function(db){
  //initial("http://www.cedom.gov.ar/es/legislacion/normas/leyes/ley4576.html", "./leycedom.json");
  initial("www.cedom.gov.ar", "/es/legislacion/normas/leyes/index.php?pagina=9", "./listaleyes.json", function(leyes){ listCallback(leyes, db)});
  //initial("www.cedom.gov.ari", "/es/legislacion/normas/leyes/index.php?pagina=9", "./listaleyes.json", function(leyes){ listCallback(leyes, db)});
  //initial("http://www.cedom.gov.ar/es/legislacion/normas/leyes/index.php?pagina=9", "./listaleyes.json", function(leyes){ listCallback(leyes, db)});
});

function initial(url, path, regexConfigFilename, outputCallBack){
  var jsonRegex=readStructure(regexConfigFilename);
  traerPag(url, path, function(body){
    parse(body, jsonRegex, function(leyes){
      outputCallBack(leyes, dbConnection);
    })
  });  
}

function listCallback(leyes, dbConnection){
  for(ley in leyes){
    var url1=leyes[ley].url.split('\/')[2];
    var path1="";
    var i=3;
    while(leyes[ley].url.split('\/')[i]){
      path1+="/"+leyes[ley].url.split('\/')[i];
      i++;
    }
    try{
      initial(url1, path1, "./leycedom.json", function(data){writerCallback(data, dbConnection)});
    }catch(e){
      console.log("Error parsing "+leyes[ley].url);
    }
  }
}

function connectToDB(dbName, callback){
  mongoose.connect('mongodb://localhost/'+dbName);
  createEntity(createDBSchema(readStructure("./leycedom.json")));
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function(db) {
    callback(db);
  });
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
    if(sourceStructure.structure[token].array=="true"){
      jsonSchema+='"'+sourceStructure.structure[token].dbField+'"'+":";
      jsonSchema+="["+''+JSON.stringify(sourceStructure.structure[token].dbFieldType)+''+"]";
    }else{
      jsonSchema+='"'+sourceStructure.structure[token].dbField+'"'+":";
      jsonSchema+=''+JSON.stringify(sourceStructure.structure[token].dbFieldType)+'';
    }
  }
  jsonSchema+="}";
  return jsonSchema;
}

function createEntity(schemaLocal){
  var entityTemp=JSON.parse(schemaLocal);
  var entitySchema = mongoose.Schema(entityTemp);
  Entity = mongoose.model("entities", entitySchema);
}

function writerCallback(writeEntity, dbConnection){
  if(writeEntity){
    var entityInstance = new Entity(writeEntity);
    entityInstance.save(function(){console.log('saved')});
  }
}

function traerPag(host, path, callback){
  var options = {
      host: host
    , path: path
    , port: 80
  }

  var request = http.get(options, function(res){
    var body="";
    res.setEncoding('ascii');
    res.on('end', function(){
      callback(body);
    });
    res.on('data', function(chunk){
      body += chunk;
    });
  });

}

function readStructure(fileName){
  return require(fileName);
}
