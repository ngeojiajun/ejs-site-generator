/*
*This file contain the engine to parse the Inline Data Tagging Language based pages
*/
function exists(obj,name){
  return get(obj,name)!==undefined;
}
function assign(obj,name,value){
  //resolve the name
  let lastName="";
  let orig=obj;
  for(const k of name.split(".")){
    orig=obj; //save the originals
    lastName=k;
    obj=obj[k];
    if(obj===undefined){
      obj={};
      orig[k]=obj; //create if missing
    }
  }
  //set the value using the last original handle it found
  orig[lastName]=value;
}
function get(obj,name){
  //resolve the name
  for(const k of name.split(".")){
    obj=obj[k];
    if(obj===undefined){
      return undefined;
    }
  }
  return obj;
}
function push(obj,name,value){
  //resolve the name
  for(const k of name.split(".")){
    obj=obj[k];
    if(obj===undefined){
      throw new Error("Cannot perform push on inexistant key");
    }
  }
  obj.push(value);
}
function parseIDTL(str){
  const lines=str.split("\n");
  let ret={};
  let name="";
  let content="";
  let ignore=false;
  let type="none";
  let i=0;
  for(const line of lines){
    i++;
    if(process.env.IDTL_REVEAL_LINE_CTR)
      console.log(`${i}> ${line}`)
    if(ignore){
      content+=`${content.length>0?"\n":""}${line}` //if it passes the `ejs_source` starting tag just append it to content
    }
    else{
      if(line.trim()==="#####"){
        ignore=true;
        continue;
      }
      else if(line.trim()==="####"){ //closing tag of the array
        if(type!=="array"){
          throw new Error(`IDTL parse error: unexpected [ARRAY_VALUE_END] at line ${i}`);
        }
        else if(content.trim().length>0){
          push(ret,name,content.trim()); //push it
          content="";
        }
        type="none"; // clear the type
      }
      else if(line.trim()==="###"){ //closing tag of the prop
        if(type!=="prop"){
          throw new Error(`IDTL parse error: unexpected [PROP_VALUE_END] at line ${i}`);
        }
        else if(content.trim().length>0){
          assign(ret,name,content.trim()); //set it
          content="";
        }
        type="none"; // clear the type
      }
      else if(line.trim().startsWith("####")){ //array start
        //get the name
        name=line.slice(4).trim();
        //check is the operation is safe to do
        if(!exists(ret,name)){
          assign(ret,name,[]);
        }
        else if(!Array.isArray(get(ret,name))){
          throw new Error(`IDTL parse error: cannot append into the non array prop at line ${i}`);
        }
        type="array";
      }
      else if(line.trim().startsWith("###")){ //prop start
        //get the name
        name=line.slice(3).trim();
        //check is the operation is safe to do
        if(exists(ret,name)){
          throw new Error(`IDTL parse error: variable ${name} already defined at line ${i}`);
        }
        type="prop";
      }
      else if(type==="none"&&line.trim().length!=0){
        throw new Error(`IDTL parse error: invalid statement at line ${i}`);
      }
      else{
        content+=`${content.length>0?"\n":""}${line}`;
      }
    }
  }
  if(type!=="none"){
    throw new Error("IDTL parse error: unexpected EOF");
  }
  ret.ejs_source=content;
  return ret;
}
module.exports = parseIDTL;
