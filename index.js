#!/usr/bin/env node
const ejs=require("ejs");
const { Command } = require('commander');
const program = new Command();
const process = require('process');
const fs=require("fs");
const glob = require("glob");
const path=require("path");
const fse = require('fs-extra');
const parseIDTL=require("./idtl.js");
//
// Globals and typedefs
//
let Views={};
let Interops={};
function View(view,data){
  this.view=view;
  this.data=data;
}
function deepAssignCopy(target,source){
  for(const k of Object.keys(source)){
    if(typeof source[k]=="object"){
      if(typeof target[k]!="object"){
        target[k]={};
      }
      deepAssignCopy(target[k],source[k]);
    }
    else{
      target[k]=source[k]||target[k];
    }
  }
}
const lastElement=arr=>arr[arr.length-1];
const defaults={
  view:"default"
};
const _paths={
  data:n=>path.join(options.Data,n),
  base:n=>path.join(options.Base,n),
  views:n=>path.join(options.Views,n)
}
function generateRuntimeDefaultVars(filename){
  //replace the ending extension of the back with ""
  filename=filename.replace(/\.(html|ejs|json|idtl)$/,"")
  let unitName=lastElement(filename.replace("\\","/").split("/"));
  return{
    build_time:buildStart,
    page_unit_name:unitName,
    page_unit_path:filename,
    Interops:Interops
  }
}
function evalEJS(ctx /*provided from bind*/,str){
  //eval the EJS from the variables
  return ejs.render(str,ctx);
}
//
// Parameter parsing
//
program.version('4.0.0');
program.option("-views <dir>","The directory for the views","./views");
program.option("-data <dir>","The directory for the data","./data");
program.option("-out <dir>","The directory for the outputs","./out");
program.option("-statics <dir>","The directory for the static files which will copied on the end of the build","./statics");
program.option("-base <dir>","The base directory for the execution","./");
program.parse();
//
// Environment Init
//
let options=program.opts();
options.Base=path.resolve(options.Base); //resolve the Base first
if(fs.existsSync(options.Base)){
  process.chdir(options.Base);
}
else{
  console.error(`${options.Base} is not exists`);
  process.exit(-1);
}
for(const key of Object.keys(options)){
  if(key==="Base")continue;
  options[key]=path.resolve(options[key]);
}
console.log('Options: ', options);
console.log("Loading interops.....");
if(fs.existsSync("plugin.js")){
  console.log("Found plugin.js.... Loading....");
  Interops=require(path.join(options.Base,"plugin.js"));
}
else{
  console.log("No plugin.js found... Skipping this step...")
}
console.log("Running build_start hook....");
Interops.hooks?.build_start?.();
console.log("Compiling the views....");
console.log(`Changing directory to ${options.Views}`);
if(fs.existsSync(options.Views)){
  process.chdir(options.Views);
}
else{
  console.error(`${options.Views} is not exists`);
  process.exit(-1);
}
const buildStart=new Date();
//
// EJS compile
//
const foundEJS=glob.sync("*.ejs");
for(const filename of foundEJS){
  const name=filename.replace(/\.ejs$/,"");
  console.log(`Compiling view ${name} .....`);
  const view=ejs.compile(fs.readFileSync(filename,'utf8'));
  let defaults={};
  if(fs.existsSync(`${filename}.json`)){
    console.log(`Loading defaults for the view ${name}`);
    defaults=fs.readFileSync(`${filename}.json`,'utf8')??"{}";
    if(JSON.parse(defaults)._viewParam?.ignore==true){
      console.log("File ignored due to the _viewParam ignore setting");
      continue;
    }
  }
  Views[name]=new View(view,defaults);
}
//
// Wipe and recreate the structure of the output directory
//
console.log(`Reinitializing the output directories....`);
fs.rmSync(options.Out, { recursive: true, force: true });
fs.mkdirSync(options.Out);
glob.sync("**/**/",{cwd:options.Data}).sort((a,b)=>a.length-b.length).forEach((dir) => {
  fs.mkdirSync(path.join(options.Out,dir));
});
//change the directory back to the Views and compile the files
process.chdir(options.Views);
console.log(`Generating the page....`);
//JSON files
let dataFiles=glob.sync("**/**/*.json",{cwd:options.Data});
for(const filename of dataFiles){
  if(/(\.html\.json|\.ejs\.json)$/.test(filename))continue;
  if(!(/\.(json)$/).test(filename))continue; //bug?
  console.log(`Compiling file ${filename}.....`);
  //load the json
  let json=JSON.parse(fs.readFileSync(`${path.join(options.Data,filename)}`,'utf8'));
  let viewParam={}; //the view parameters
  Object.assign(viewParam,defaults); //load the defaults
  if(json._viewParam){
    //if it is defined in the json copy it over and delete it
    Object.assign(viewParam,json._viewParam);
    delete json._viewParam;
  }
  //dont compile this file is the "ignore" is set to true in _viewParam
  if(viewParam.ignore==true){
    continue;
  }
  const view=Views[viewParam.view];
  if(!view){
    console.error(`Cannot load the view named ${viewParam.view}`);
    process.exit(-1);
  }
  //Predefine the server variables
  let locals=generateRuntimeDefaultVars(filename);
  //load the variables from the default
  deepAssignCopy(locals,JSON.parse(view.data));
  //then ovewrite those using the local data
  deepAssignCopy(locals,json);
  //then export the apis
  locals._external={
    _path:_paths,
    evalEJS:evalEJS.bind(null,locals)
  }
  //finally generate the html
  const name=filename.replace(/\.json$/,".html");
  fs.writeFileSync(path.join(options.Out,name),view.view(locals));
  Interops.hooks?.new_page?.(name);
}
//HTML/EJS files
dataFiles=glob.sync("**/**/*[.ejs,.html]",{cwd:options.Data});
for(const filename of dataFiles){
  if(!(/\.(html|ejs)$/).test(filename))continue; //bug?
  console.log(`Compiling file ${filename}.....`);
  const finalName=filename.replace(/\.(html|ejs)$/,".html");
  const finalPath=path.join(options.Out,finalName);
  if(fs.existsSync(finalPath)){
    console.log(`Warning: the file ${finalPath} will be overwritten after this file has been compiled`);
  }
  //load the json metadata if exists
  let json={};
  if(fs.existsSync(path.join(options.Data,filename+".json"))){
    json=JSON.parse(fs.readFileSync(`${path.join(options.Data,filename+".json")}`,'utf8'));
  }
  let viewParam={}; //the view parameters
  Object.assign(viewParam,defaults); //load the defaults
  if(json._viewParam){
    //if it is defined in the json copy it over and delete it
    Object.assign(viewParam,json._viewParam);
    delete json._viewParam;
  }
  //dont compile this file is the "ignore" is set to true in _viewParam
  if(viewParam.ignore==true){
    continue;
  }
  const view=Views[viewParam.view];
  if(!view){
    console.error(`Cannot load the view named ${viewParam.view}`);
    process.exit(-1);
  }
  //Predefine the server variables
  let locals=generateRuntimeDefaultVars(filename);
  //load the variables from the default
  deepAssignCopy(locals,JSON.parse(view.data));
  //then ovewrite those using the local data
  deepAssignCopy(locals,json);
  //then export the apis and the HTML/EJS files to include directly
  locals._external={
    _path:_paths,
    evalEJS:evalEJS.bind(null,locals),
    ejs_include:filename
  }
  //finally generate the html
  fs.writeFileSync(finalPath,view.view(locals));
  Interops.hooks?.new_page?.(finalName);
}
//IDTL file support
dataFiles=glob.sync("**/**/*.idtl",{cwd:options.Data});
for(const filename of dataFiles){
  if(!(/\.idtl$/).test(filename))continue; //bug?
  console.log(`Compiling file ${filename}.....`);
  const finalName=filename.replace(/\.idtl$/,".html");
  const finalPath=path.join(options.Out,finalName);
  if(fs.existsSync(finalPath)){
    console.log(`Warning: the file ${finalPath} will be overwritten after this file has been compiled`);
  }
  //this file do not have its own metadata in separated it is inside the same file
  //ask the engine to parse it
  let json=parseIDTL(fs.readFileSync(`${path.join(options.Data,filename)}`,'utf8'));
  let viewParam={}; //the view parameters
  Object.assign(viewParam,defaults); //load the defaults
  if(json._viewParam){
    //if it is defined in the json copy it over and delete it
    Object.assign(viewParam,json._viewParam);
    delete json._viewParam;
  }
  //dont compile this file is the "ignore" is set to true in _viewParam
  if(viewParam.ignore==true){
    continue;
  }
  const view=Views[viewParam.view];
  if(!view){
    console.error(`Cannot load the view named ${viewParam.view}`);
    process.exit(-1);
  }
  //Predefine the server variables
  let locals=generateRuntimeDefaultVars(filename);
  //load the variables from the default
  deepAssignCopy(locals,JSON.parse(view.data));
  //then ovewrite those using the local data
  deepAssignCopy(locals,json);
  //then export the apis and the HTML/EJS files to include directly
  locals._external={
    _path:_paths,
    evalEJS:evalEJS.bind(null,locals)
  }
  //finally generate the html
  fs.writeFileSync(finalPath,view.view(locals));
  Interops.hooks?.new_page?.(finalName);
}
console.log("Copying the static files to the output....")
// To copy a folder or file
fse.copySync(options.Statics, options.Out,{overwrite:true});
console.log("Running build_done hook....");
Interops.hooks?.build_done?.();
console.log("Done");
