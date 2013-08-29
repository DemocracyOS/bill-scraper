var request = require('request'),
  Iconv  = require('iconv').Iconv,
  ent = require('ent'),
  parse = require('./parseHtml'),
  http = require('http'),
  mongoose = require('mongoose');


var dbConnection=connectToDB("cedom1", function(db){
  //initial("http://www.cedom.gov.ar/es/legislacion/normas/leyes/ley4576.html", "./leycedom.json");
  initial("www.cedom.gov.ar", "/es/legislacion/normas/leyes/index.php?pagina=9", "./listaleyes.json", function(leyes){ listCallback(leyes, db, 0)});
});

function initial(url, path, regexConfigFilename, outputCallBack){
  var jsonRegex=readStructure(regexConfigFilename);
  traerPag(url, path, function(body){
    parse(body, jsonRegex, function(leyes){
      outputCallBack(leyes, dbConnection);
    })
  });  
}

/*function listCallback(leyes, dbConnection){
  for(ley in leyes){
    console.log("ttt: " + typeof(ley));
    var url1=leyes[ley].url.split('\/')[2];
    var path1="";
    var i=3;
    while(leyes[ley].url.split('\/')[i]){
      path1+="/"+leyes[ley].url.split('\/')[i];
      i++;
    }
    try{
      var extradataA = new Object();
      extradataA.art_no=/([0-9]{1,4}).* /.exec(path1)[1];
      console.log("path1: " + path1);
      console.log("arti: " + extradataA.art_no);
      initial(url1, path1, "./leycedom.json", function(data){writerCallback(data, extradataA, dbConnection)});
    }catch(e){
      console.log("Error parsing "+leyes[ley].url);
    }
  }
}

function writerCallback(writeEntity, extradata, dbConnection){
  if(writeEntity){
    writeEntity.art_no=extradata.art_no;
    var entityInstance = new Entity(writeEntity);
    console.log('saving: '+ writeEntity.art_no );
    entityInstance.save(function(){console.log('saved: '+ writeEntity.art_no )});
  }
}
*/
function listCallback(leyes, dbConnection, index){
  if(!leyes[index]) return;
  var url1=leyes[index].url.split('\/')[2];
  var path1="";
  var i=3;
  while(leyes[index].url.split('\/')[i]){
    path1+="/"+leyes[index].url.split('\/')[i];
    i++;
  }
  try{
    var extradataA = new Object();
    extradataA.art_no=/([0-9]{1,4}).*/.exec(path1)[1];
    console.log("path1: " + path1);
    console.log("arti: " + extradataA.art_no);
    initial(url1, path1, "./leycedom.json", function(data){writerCallback(data, extradataA, dbConnection, leyes, index)});
  }catch(e){
    console.log("Error parsing "+leyes[index].url+" e: "+e.message);
  }
}

function writerCallback(writeEntity, extradata, dbConnection, leyes, index){
  if(writeEntity){
    writeEntity.art_no=extradata.art_no;
    var entityInstance = new Entity(writeEntity);
    console.log('saving: '+ writeEntity.art_no );
    entityInstance.save(function(){console.log('saved: '+ writeEntity.art_no )});
    listCallback(leyes, dbConnection, index+1);
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
  //ToDo: this was a dirty fix, make this readable from the schema file (leycedom.json)
  jsonSchema+=',"art_no":';
  jsonSchema+='"String"';
  jsonSchema+="}";
  return jsonSchema;
}

function createEntity(schemaLocal){
  var entityTemp=JSON.parse(schemaLocal);
  var entitySchema = mongoose.Schema(entityTemp);
  Entity = mongoose.model("entities", entitySchema);
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
    //res.setEncoding('utf8');
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
