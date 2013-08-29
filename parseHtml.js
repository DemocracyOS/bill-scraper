function parseHtml(urlBody, regexConf, resultCallback){
  var findings=getJsonFromString(urlBody, regexConf);
  resultCallback(findings);
}

module.exports = parseHtml;

function getJsonFromString(cadena, structure){
  var retVal={};
  var retValArray=new Array();
  for(token in structure.structure){
    if(structure.many){
      var regexp1 = new RegExp(structure.structure[token].regex, "g");
      var paragraph = cadena.match(regexp1);
      var regexp2 = new RegExp(structure.structure[token].regex);
      for(parag in paragraph){
        var thisPart= getScrapped(paragraph[parag], regexp2, structure.structure[token].regex_part);
        var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(thisPart)
        var obj={}        
        obj[structure.structure[token].dbField]=thisFullPart;
        retValArray.push(obj);
      }
    }else if(structure.structure[token].array=="true"){
      var regexp1 = new RegExp(structure.structure[token].regex, "g");
      var paragraph = cadena.match(regexp1);
      var regexp2 = new RegExp(structure.structure[token].internal_regex);
      retVal[structure.structure[token].dbField]=new Array();
      for(parag in paragraph){
        var thisPart= getScrapped(paragraph[parag], regexp2, structure.structure[token].regex_part);
        var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(thisPart)
        var obj={};
        obj[structure.structure[token].internal_dbField]=thisFullPart;
        retVal[structure.structure[token].dbField].push(obj);
      }
    }else{
      var thisFullPart=(structure.structure[token].fixed_pre_string?structure.structure[token].fixed_pre_string:'')+sanitizeString(getScrapped(cadena, structure.structure[token].regex, structure.structure[token].regex_part));
      retVal[structure.structure[token].dbField]=thisFullPart;
    }
  }
  console.log("daft: " + JSON.stringify(retVal));
  return structure.many?retValArray:retVal;
}

/*function getJsonFromString(cadena, structure){
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
console.log("-----------");
console.log("-----------");
console.log("-----------");
console.log("-----------");
console.log("Ssssss: " + paragraph);
console.log("-----------");
console.log("-----------");
console.log("-----------");
console.log("-----------");
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
console.log("entonces: " + thisPart);
console.log("-----------");
console.log("-----------");
console.log("-----------");
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
  if(structure.many){
    return JSON.parse("[" + arrayRetVal + "]");
  }else{
    try{
console.log("parseando: " + retVal.replace(/\n/g, " ").replace(/\r/g, " "));
      return JSON.parse(retVal.replace(/\n/g, " ").replace(/\r/g, " "));
    }catch(e){
      console.log("Error parsing: " + e);
      return null;
    }   
  }
}*/


function getScrapped(fullString, re, partToKeep){
  if(partToKeep==undefined) partToKeep=1;
  var rePattern = new RegExp(re);
  var results = fullString.match(rePattern);
  if(!results) return null;
  return results[partToKeep];
}

function sanitizeString(str){
  return str==null?null:str.replace(/–/g, '-').replace(/\"/g, '');
}
