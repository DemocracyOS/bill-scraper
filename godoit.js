var Browser = require("zombie")

function main(){
  var browser = new Browser({ debug: true })
  browser.runScripts = false
  browser.visit("file:///Users/pnmoyano/Downloads/despacho.html", function(){
    processPage(browser);
  });
}

function processPage(browser){
  var paragraphs=browser.querySelectorAll("p");
  var articles=new Array();
  for(parag in paragraphs){
    var thisParag=sanitizeText(paragraphs[parag].innerHTML);
    //if this is an empty paragraph, ignore it
    if(!thisParag || thisParag.trim()==""){
      continue;
    }
    if(thisParag.substr(0,15)=="Sala de la Comi"){ //this text tell us there are no more articles
      break
    }else if(thisParag.substr(0,3)=="Art"){ //if an Article is starting
      articles.push(thisParag);
    }else{
      //if there is at least one article, add the text to the last of them
      if(articles.length>0){
        articles[articles.length-1]=articles[articles.length-1]+"\n"+thisParag;
      }
    } 
  }
  showArticles(articles);
}

//shows articles, just for debugging purposes
function showArticles(articles){
  for(a in articles){
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log("--------------------");
    console.log(articles[a]);
  }
}

//removes html from text and replaces new lines with a blank space 
function sanitizeText(str){
  if(!str) return str;
  str=str.replace(/<\/?[^>]+(>|$)/g, "");
  str=str.replace(/(\n|\r)/g, " ");
  return str;
}

main();
