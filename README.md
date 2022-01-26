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
To be added
