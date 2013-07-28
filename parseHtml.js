function parseHtml(urlBody, regexConf, resultCallback){
  var findings=getJsonFromString(urlBody, regexConf);
  resultCallback(findings);
}

module.exports = parseHtml;

function getJsonFromString(cadena, structure){
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
  if(structure.many){
    return JSON.parse("[" + arrayRetVal + "]");
  }else{
  	try{
      return JSON.parse(retVal);
    }catch(e){
      console.log("Error parsing: " + e);
      return null;
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

function sanitizeString(str){
  return str==null?null:str.replace('"', '');
}