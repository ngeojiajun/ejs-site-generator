/*
*This file contain the engine to parse the Inline Data Tagging Language based pages
*/
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
          ret[name].push(content); //push it
          content="";
        }
        type="none"; // clear the type
      }
      else if(line.trim()==="###"){ //closing tag of the prop
        if(type!=="prop"){
          throw new Error(`IDTL parse error: unexpected [PROP_VALUE_END] at line ${i}`);
        }
        else if(content.trim().length>0){
          ret[name]=(content); //set it
          content="";
        }
        type="none"; // clear the type
      }
      else if(line.trim().startsWith("####")){ //array start
        //get the name
        name=line.slice(4).trim();
        //check is the operation is safe to do
        ret[name]=ret[name]??[];
        if(!Array.isArray(ret[name])){
          throw new Error(`IDTL parse error: cannot append into the non array prop at line ${i}`);
        }
        type="array";
      }
      else if(line.trim().startsWith("###")){ //prop start
        //get the name
        name=line.slice(3).trim();
        //check is the operation is safe to do
        if(ret[name]!=undefined){
          throw new Error(`IDTL parse error: variable already defined at line ${i}`);
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
