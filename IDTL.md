## About Inline Data Tagging Language (IDTL)
Inline Data Tagging Language is an extension implemented into the engine which allows the creators to include their variables and the actual HTML tagging inside one file only.

## Technical differences on template level
When the engine process the `ejs` and `html` file, the path to the file is given through the `ejs_include` variable which program will `include()` into the engine when compiling. With the `idtl` files, the HTML tagging is provided through `ejs_source` variable. Template are supposed to either flush it to the output using something like `<- ejs_source %>` or evaluate the inlined EJS using `evalEJS(ejs_source)`.

## Grammars
### Basic Grammar
Engine use following two types of the tags in general
|Tags|Description|
|----|------------|
|`###<name>`|Define string property of <name> using the tag content|
|`####<name>`|Define string property as the element of array named <name> using the tag content|

All tags must be closed using the similar prefix.
### `ejs_source`
In order to signal the start of the `ejs_source` just write a line of `#####`. IDTL parsing will be stopped once this mark is parsed
