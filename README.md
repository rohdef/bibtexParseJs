bibtexParseJs
=============
A JavaScript library that parses BibTeX parser. Forked from 
[bibtex-parser](https://github.com/mikolalysenko/bibtex-parser).


## Format

The parser outputs a JSON representation of the BibTeX-file.  The
format contains representation for strings, preamples, comments and
entries.

### Types

On the global object there is a types object containing the constants
used inside the parser.  When testing for output please use these in
case the text should change (it's likely to happen if ambiguity issues
arise).

```
var bibtexParse = require("...");
bibtexParse.types;
/**
the types contains:
    TEXT_TYPE: marks a text part, such as the {Hovercraft} or "Eels" in a title
    STRING_TYPE: marks a string defined in a BibTeX string,
    ERROR_TYPE: marks an error, an object with the type ERROR_TYPE
                will usually contain a message and the part triggering the error
    ENTRYTAG_TYPE: marks an entry tag of a BibTeX entry, such as a title, author, etc.
                   these entries will contain a key with the name of the tag, such as title
                   and a value typically with an array of items
    KEY_TYPE: the identifing key for an entry eg. @{foo, ...}
              will give a KEY_TYPE with foo, do not confuse this with the entry tag key
    
    COMMENT_ENTRY: 
    PREAMBLE_ENTRY: 
    STRING_ENTRY: 
    OTHER_ENTRY: 
*/
```

### Strings

The strings are located in the returned object:

    var bibtexParse = require("...");
    var parsed = bibtexParse.toJSON('...');

    console.log(parsed.strings);

All internal strings are converted to lowercase when put into the
```strings``` object.  All strings is an array consisting of the parts
that constitute that string.  A shortcut method ```toString(string)```
is provided on the ```strings``` object, to parse it into a normal
text string.  Thus:

    var bibtexParse = require("...");
    var parsed = bibtexParse.toJSON('@STRING{someCamelCase = {Hello world}}\n' +
                                    '@STRING{someOtherCase = "Olivier says: " # someCamelCase}\n');

    var strings = parsed.strings;
    /*
    This will contain:
    strings.somecamelcase = [{type: 'text', part: 'Hello world'}];
    strings.someothercase = [{type: 'text', part: 'Olivier says: '}, {type: 'string', part: 'someCamelCase'}]

    the types should be tested against the types constant if checked, thus:
    bibtexParse.types.STRING_TYPE and bibtexParse.types.TEXT_TYPE
    */

    console.log(strings.toString(strings.somecamelcase)); // prints: 'Hello world'
    console.log(strings.toString(strings.someothercase)); // prints: 'Olivier says: Hello world'


## Using in Browser
Include bibtexParse.js and call 

```
bibtexParse.toJSON('@article{sample1,title={sample title}}');
```

## Using in [Node.js](http://nodejs.org/)
Install     ```npm install bibtex-parse-js```

```
var bibtexParse = require('bibtex-parse-js');

var sample = bibtexParse.toJSON('@article{sample1,title={sample title}}');

console.log(sample);
``` 

## Contributing
   Contributions are welcome. Please make sure the unit test(test/runTest.js) reflects the
   changes and completes successfully. 


## Credits
(c) 2010 Henrik Muehe.  MIT License 
[visit](https://code.google.com/p/bibtex-js/)


CommonJS port maintained by Mikola Lysenko 
[visit](https://github.com/mikolalysenko/bibtex-parser)
