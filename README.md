# EJS Site Generator
A simple tool that generate the HTML files based on the EJS template and the data for the static site.

## Usage

```
$ejs-site-generator -h
Usage: index [options]

Options:
  -V, --version  output the version number
  -views <dir>   The directory for the views (default: "./views")
  -data <dir>    The directory for the data (default: "./data")
  -out <dir>     The directory for the outputs (default: "./out")
  -base <dir>    The base directory for the execution (default: "./")
  -h, --help     display help for command
```

### Directory structure of the view folder
|Name|Description|
|-----|------------|
|`default.ejs`|The default view that it should the engine load if the `_viewParam.view` value is missing inside the data files|
|`<name>.ejs`| The views for the file|
|`<name>.ejs.json`|The default value assignments for the file|

*Alert: If a view inherit another view, all key present in the parent json file must be also present in the view's json file or it will causes some `undefined` symbol errors. The json inheriting is work in progress*

### Directory structure of the data folder
The engine accept two type of files:
1. `.json` files which only contains the data file that the template require
2. `.ejs` or `.html` files which contain the html code to be directly included inside the template.
This require the template to support it by include the file specified by the `_external.ejs_include` variable.
The metadata required by the template could be provided through the `<filename>.json` under the same directory.

## API exported by the engine
|Name|Description|
|-----|-------------|
|`_external._path.data(name)`|Return the resolved path for the path provided relative to the data directory|
|`_external._path.base(name)`|Return the resolved path for the path provided relative to the base directory|
|`_external._path.views(name)`|Return the resolved path for the path provided relative to the views directory|

## Special key in the JSON metadata
The `_viewParam` key allows the developer to specify the behavior of the compiler
```js
{
  "_viewParam":{
    "ignore": true|false,
    "view":"default"
  }
}
```
|Name|Type|Description|
|---|-----|-------|
|`ignore`|All|The compiler should ignore this file from being processed|
|`view`|Data pages only|The name of view that compiler will use while building the html for the data|

## Runtime Variables
This contain a list of the variables which will be defined by the engine if not defined by the page

|Name|Description|
|----|-----------|
|`build_time`|The JavaScript `Date` Object which represent the timestamp that the build is started|
|`page_unit_name`|The name of the page which usually taken from the filename|
|`page_unit_path`|Similar with the `page_unit_name` but provided in full path|
