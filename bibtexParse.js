/* start bibtexParse 0.0.2 */

// Original work by Henrik Muehe (c) 2010
//
// CommonJS port by Mikola Lysenko 2013
//
// Port to Browser lib by ORCID / RCPETERS
//
// Issues:
//  no comment handling within strings
//  no string concatenation
//  no variable values yet
// Grammar implemented here:
//  bibtex -> (string | preamble | comment | entry)*;
//  string -> '@STRING' '{' key_equals_value '}';
//  preamble -> '@PREAMBLE' '{' value '}';
//  comment -> '@COMMENT' '{' value '}';
//  entry -> '@' key '{' key ',' key_value_list '}';
//  key_value_list -> key_equals_value (',' key_equals_value)*;
//  key_equals_value -> key '=' value;
//  value -> value_quotes | value_braces | key;
//  value_quotes -> '"' .*? '"'; // not quite
//  value_braces -> '{' .*? '"'; // not quite
(function (exports) {
    function BibtexParser() {
      this.debug = {};
      this.pos = 0;
      this.input = "";

      this.entries = new Array();
      this.strings = {
        jan: "January",
        feb: "February",
        mar: "March",
        apr: "April",
        may: "May",
        jun: "June",
        jul: "July",
        aug: "August",
        sep: "September",
        oct: "October",
        nov: "November",
        dec: "December"
      };
      this.bibtexStrings = {};

      this.currentEntry = "";

      this.setInput = function (t) {
        this.input = t;
      };

      this.getEntries = function () {
        return this.entries;
      };

      this.isWhitespace = function (s) {
        return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
      };

      this.match = function (s, length) {
        length = length || s.length;

        this.skipWhitespace();
        if (this.input.substring(this.pos, this.pos + length).match(s)) {
          this.pos += length;
        } else {
          throw "Token mismatch, expected " + s + ", found " + this.input.substring(this.pos);
        }
        this.skipWhitespace();
      };

        this.tryMatch = function (s) {
            this.skipWhitespace();
            if (this.input.substring(this.pos, this.pos + s.length).match(s)) {
                return true;
            } else {
                return false;
            }
            this.skipWhitespace();
        };

        /* when search for a match  all text can be ignored, not just white space */
      this.matchAt = function () {
            while (this.input.length > this.pos && this.input[this.pos] != '@') {
                this.pos++;
            }

            if (this.input[this.pos] == '@') {
                return true;
            }
            return false;
        };


        this.skipWhitespace = function () {
            while (this.isWhitespace(this.input[this.pos])) {
                this.pos++;
            }
            if (this.input[this.pos] === "%") {
                while (this.input[this.pos] != "\n") {
                    this.pos++;
                }
                this.skipWhitespace();
            }
        };

      this.value_braces = function () {
        var bracecount = 0;
        this.match("{");
        var start = this.pos;
        while (true) {
          if (this.input[this.pos] == '}' && this.input[this.pos - 1] != '\\') {
            if (bracecount > 0) {
              bracecount--;
            } else {
              var end = this.pos;
              this.match("}");
              return this.input.substring(start, end);
            }
          } else if (this.input[this.pos] == '{') {
            bracecount++;
          } else if (this.pos == this.input.length - 1) {
            throw "Unterminated value";
          }
          this.pos++;
        }
      };

      this.value_quotes = function () {
        this.match('"');
        var start = this.pos;
        while (true) {
          if (this.input[this.pos] == '"' && this.input[this.pos - 1] != '\\') {
            var end = this.pos;
            this.match('"');
            return this.input.substring(start, end);
          } else if (this.pos == this.input.length - 1) {
            throw "Unterminated value:" + this.input.substring(start);
          }
          this.pos++;
        }
      };

      this.single_value = function () {
        var start = this.pos;
        if (this.tryMatch("{")) {
          return this.value_braces();
        } else if (this.tryMatch('"')) {
          return this.value_quotes();
        } else {
          var k = this.key();

          if (this.strings[k.toLowerCase()]) {
            return this.strings[k];
          } else if (k.match("^[0-9]+$")) {
            return k;
          } else if (k.match("^[?]$")) {
            console.log("Found potential errornous '?'. The debug output is:");
            console.log(JSON.stringify(this.debug, null, 2));
            console.log();
            return k;
          } else if (k.match("^[.]+$")) {
            console.log("Found potential errornous '" + k + "'. The debug output is:");
            console.log(JSON.stringify(this.debug, null, 2));
            console.log();
            return k;
          } else {
            throw "Value expected at pos {" + this.pos + "}, debug info: {" + JSON.stringify(this.debug) + "}:" + this.input.substring(start);
          }
        }
      };

      this.value = function () {
        var values = [];
        values.push(this.single_value());
        while (this.tryMatch("#")) {
          this.match("#");
          values.push(this.single_value());
        }
        return values.join("");
      };

      this.key = function () {
        var start = this.pos;
        while (true) {
          if (this.pos == this.input.length) {
            throw "Runaway key";
          }

          if (this.input[this.pos].match("[a-zA-Z0-9?_:\\./-]")) {
            this.pos++;
          } else {
            return this.input.substring(start, this.pos);
          }
        }
      };

      this.key_equals_value = function () {
        var key = this.key();
        if (this.tryMatch("=")) {
          this.match("=");
          var val = this.value();
          return [key.toLowerCase(), val];
        } else {
          throw "... = value expected, equals sign missing:" + this.input.substring(this.pos);
        }
      };

      this.key_value_list = function () {
        var kv = this.key_equals_value();
        this.currentEntry['entryTags'] = {};
        this.currentEntry['entryTags'][kv[0]] = kv[1];
        while (this.tryMatch(",")) {
          this.match(",");
          // fixes problems with commas at the end of a list
          if (this.tryMatch("}")) {
            break;
          }
          kv = this.key_equals_value();
          this.currentEntry['entryTags'][kv[0]] = kv[1];
        }
      };

      this.entry_body = function (d) {
        this.currentEntry = {};
        var citeKey = this.key();
        this.debug.lastKey = citeKey;
        this.currentEntry['citationKeyUnmodified'] = citeKey;
        this.currentEntry['citationKey'] = citeKey.toLowerCase();
        this.currentEntry['entryType'] = d.substring(1);
        this.match(",");
        this.key_value_list();
        this.entries.push(this.currentEntry);
      };

      this.directive = function () {
        this.match("@");
        return "@" + this.key();
      };

        this.string = function () {
          this.debug.lastDirective = "string";
          var kv = this.key_equals_value();
          this.strings[kv[0].toLowerCase()] = kv[1];
          this.bibtexStrings[kv[0].toLowerCase()] = kv[1];
        };

        this.preamble = function () {
          this.debug.lastDirective = "preamble";
          this.value();
        };

        this.comment = function () {
          this.debug.lastDirective = "comment";
          //this.matchAt();
          /*          var tokens = this.matchToken(0, this.pos, "}");
          console.log("#######");
          console.log(JSON.stringify(tokens, null, '  '));
          console.log("#######");*/
          this.single_value();
        };

        this.entry = function (d) {
          this.debug.lastDirective = "entry";
          this.entry_body(d);
        };

      this.indent = function(level) {
        var indent = "";
        for (var i=0; i<level; i++) indent += "\t";
        return indent;
      };

      this.matchText = function(startPos, token) {
        var endPos = startPos;
        var char = this.input[endPos++];

        while (char !== token) {
          char = this.input[endPos++];
        }

        return {
          startPos: startPos,
          endPos: endPos-1,
          part: this.input.substring(startPos, endPos-1)
        };
      };


      /**
       * Beginning to do proper parsing
       */

      const COMMA = ",";
      const L_BRACE = "{";
      const R_BRACE = "}";
      const HASH = "#";
      const EQUAL = "=";
      const D_QUOTE = "\"";

      this.matchValue = function(pos) {
        var startPos = pos;
        var endPos = pos;
        var char = this.input[endPos++];
        var parts = [];

        var part;
        while (char !== COMMA) {
          if (char === D_QUOTE) {
            part = this.matchText(endPos, D_QUOTE);
            parts.push({
              type: "text",
              delimiter: D_QUOTE,
              content: part
            });
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === L_BRACE) {
            part = this.matchText(endPos, R_BRACE);
            parts.push({
              type: "text",
              delimiter: L_BRACE,
              content: part
            });
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === HASH) {
            // Need to encapsulate rule that concatenation is only legal with quotes,
            // not curley brackets
            startPos = endPos;
          } else if (char === EQUAL) {
            parts.push({
              type: "error",
              message: "Invalid token parsed, was looking for a comma [,] but found equals [=], your BibTeX most likely contains an error"
            });
            startPos = endPos;
            break;
          } else if (char === R_BRACE) {
            // Last entry does not require comma termination
            endPos--;
            break;
          }

          char = this.input[endPos++];
        }

        if (startPos<endPos) {
          part = this.input.substring(startPos, endPos-1);
          if (part.trim().length > 0){
            parts.push({
              type: "error",
              message: "Excpected no characters between the last string or text and the comma",
              part: part
            });
          }
        }

        return {
          startPos: pos,
          endPos: endPos-1,
          parts: parts
        };
      };

      this.matchToken = function(l, pos, token) {
        var startPos = pos;
        var endPos = pos;
        var char = this.input[endPos++];
        var parts = [];

        var part;
        while (char !== token) {
          if (char === D_QUOTE) {
            part = this.matchToken(l+1, endPos, D_QUOTE);
            parts.push(part);
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === L_BRACE) {
            part = this.matchToken(l+1, endPos, R_BRACE);
            parts.push(part);
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === COMMA) {
            parts.push(this.input.substring(startPos, endPos-1));
            startPos = endPos;
          } else if (char === EQUAL) {
            part = this.matchValue(endPos);
            parts.push({
              type: "entryTag",
              key: this.input.substring(startPos, endPos-1).trim(),
              value: part
            });
            endPos = part.endPos+1;
            startPos = endPos;
          }

          char = this.input[endPos++];
        }

        if (startPos<endPos) {
          part = this.input.substring(startPos, endPos-1);
          if (part.trim().length > 0){
            parts.push(this.input.substring(startPos, endPos-1));
          }
        }

        return {
          startPos: pos,
          endPos: endPos-1,
          parts: parts
        };
      };

      this.bibtex = function () {
        while (this.matchAt()) {
          var d = this.directive().toLowerCase();
          this.match("[{(]", 1);
          if (d == "@string") {
            this.string();
          } else if (d == "@preamble") {
            this.preamble();
          } else if (d == "@comment") {
            this.comment();
          } else {
            this.entry(d);
          }

          this.match("[})]", 1);
        }
      };
    }

    exports.toJSON = function (input) {
        var b = new BibtexParser();
        b.setInput(input);
        b.bibtex();
      return {
        entries: b.entries,
        strings: b.bibtexStrings
      };
    };


})(typeof exports === 'undefined' ? this['bibtexParse'] = {} : exports);

/* end bibtexParse */
