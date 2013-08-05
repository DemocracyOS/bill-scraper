var request = require('request'),
  parse = require('./parseHtml'),
  mongoose = require('mongoose');


var dbConnection=connectToDB("cedom1", function(db){
  //initial("http://www.cedom.gov.ar/es/legislacion/normas/leyes/ley4576.html", "./leycedom.json");
  initial("http://www.cedom.gov.ar/es/legislacion/normas/leyes/index.php?pagina=9", "./listaleyes.json", function(leyes){ listCallback(leyes, db)});
});

function initial(url, regexConfigFilename, outputCallBack){
  var jsonRegex=readStructure(regexConfigFilename);
  traerPag(url, function(body){
    parse(body, jsonRegex, function(leyes){
      outputCallBack(leyes, dbConnection);
    })
  });  
}

function listCallback(leyes, dbConnection){
  for(ley in leyes){
    try{
      initial(leyes[ley].url, "./leycedom.json", function(data){writerCallback(data, dbConnection)});
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

    console.log("Escribiendo: " + JSON.stringify(writeEntity));
  }
}

function traerPag(host, callback){
  request(host, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(body);
    }
  });
}

function readStructure(fileName){
  return require(fileName);
}


