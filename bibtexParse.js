var banana = require("./banana.js");

/* start bibtexParse 0.0.9 */

// Original work by Henrik Muehe (c) 2010
// CommonJS port by Mikola Lysenko 2013
// Parser rewrite by Rohde Fischer 2016
//
// Port to Browser lib by ORCID / RCPETERS
//
// Issues:
//  no comment handling within strings
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

      this.currentEntry = "";

      this.setInput = function (t) {
        this.input = t;
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

      this.isWhitespace = function (s) {
        return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
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

      this.match = function (s, length) {
        length = length || s.length;

        this.skipWhitespace();
        if (this.input.substring(this.pos, this.pos + length).match(s)) {
          this.pos += length;
        } else {
          throw new Error("Token mismatch, expected " + s + ", found " + this.input.substring(this.pos, this.pos+1) + " at pos: " + this.pos);
        }
        this.skipWhitespace();
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

      this.directive = function () {
        this.match("@");
        return "@" + this.key();
      };

      /**
       * Entry parsers
       */
      this.entry = function (d) {
        var content = this.matchToken(this.pos, R_BRACE);
        var citeKey = null;
        var entryTags = {};

        for (var i=0; i<content.parts.length; i++) {
          var part = content.parts[i];

          if (part.type === KEY_TYPE) {
            if (citeKey === null) {
              citeKey = part.part;
            } else {
              // Todo handle this error, two cite keys is not possible
              // secondly doesn't i have to be first by definition?
            }
          } else if (part.type === ENTRYTAG_TYPE) {
            entryTags[part.key.toLowerCase()] = part.value.parts;
          } else {
            // Afaik this should not happen in an entry
          }
        }

        this.pos = content.endPos;
        return {
          type: OTHER_ENTRY,
          citationKeyUnmodified: citeKey,
          citationKey: citeKey.toLowerCase(),
          entryType: d.substring(1),
          entryTags: entryTags
        };
      };

      this.string = function () {
        var strings = {};
        var content = this.matchToken(this.pos, R_BRACE);

        for (var i=0; i<content.parts.length; i++) {
          var part = content.parts[i];

          if (part.type === ENTRYTAG_TYPE) {
            var valuePart = "";
            for (var j=0; j<part.value.parts.length; j++) {
              var subPart = part.value.parts[j];
              if (subPart.type !== TEXT_TYPE) {
                // Todo handle error
              }
              valuePart += subPart.part;
            }

            strings[part.key.toLowerCase()] = valuePart;
          } else {
            // Todo handle error case
          }
        }

        this.pos = content.endPos;
        return {
          type: STRING_ENTRY,
          strings: strings
        };
      };

      this.preamble = function () {
        var startPos = this.pos;
        var content = this.matchValue(this.pos);
        this.pos = content.endPos;
        return {
          type: PREAMBLE_ENTRY,
          preamble: content.parts
        };
      };

      this.comment = function () {
        var startPos = this.pos;
        var content = this.matchPureToken(this.pos, R_BRACE);
        this.pos = content.endPos;
        return {
          type: COMMENT_ENTRY,
          comment: content
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

      const TEXT_TYPE = "text";
      const STRING_TYPE = "string";
      const ERROR_TYPE = "error";
      const ENTRYTAG_TYPE = "entryTag";
      const KEY_TYPE = "key";
      const COMMENT_ENTRY = "comment";
      const PREAMBLE_ENTRY = "preamble";
      const STRING_ENTRY = "string";
      const OTHER_ENTRY = "other";

      /**
       * Matches a text part of a value,
       * delimited by either quotes or curly brackets
       */
      this.matchText = function(startPos, token) {
        var endPos = startPos;
        var char = this.input[endPos++];

        while (char !== token) {
          if (char === L_BRACE && token === R_BRACE) {
            var text = this.matchText(endPos+1, R_BRACE);
            endPos = text.endPos+1;
          }

          char = this.input[endPos++];
        }

        return {
          startPos: startPos,
          endPos: endPos-1,
          part: this.input.substring(startPos, endPos-1)
        };
      };

      /**
       * Matches the value part of an entry tag,
       * it is terminated with a comma or a right bracket
       */
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
              type: TEXT_TYPE,
              delimiter: D_QUOTE,
              part: part.part
            });
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === L_BRACE) {
            part = this.matchText(endPos, R_BRACE);
            parts.push({
              type: TEXT_TYPE,
              delimiter: L_BRACE,
              part: part.part
            });
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === HASH) {
            // Need to encapsulate rule that concatenation is only legal with quotes,
            // not curley brackets
            part = this.input.substring(startPos, endPos-1).trim();
            if (part.length > 0) {
              parts.push({
                type: STRING_TYPE,
                part: part.part
              });
            }

            startPos = endPos;
          } else if (char === EQUAL) {
            parts.push({
              type: ERROR_TYPE,
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
          if (part.trim().length > 0) {
            parts.push({
              type: ERROR_TYPE,
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

      /**
       * Matches pure entries such as comments and preamples,
       * where we do not care what the contents are, just what
       * token to terminate with
       */
      this.matchPureToken = function(startPos, token) {
        var endPos = startPos;
        var char = this.input[endPos++];
        var parts = [];

        while (char !== token) {
          if (char === L_BRACE && token === R_BRACE) {
            var part = this.matchPureToken(endPos, R_BRACE);
            endPos = part.endPos+1;
          }

          char = this.input[endPos++];
        }

        parts.push(this.input.substring(startPos, endPos-1));

        return {
          startPos: startPos,
          endPos: endPos-1,
          parts: parts
        };
      };

      /**
       * Matches normal BibTeX entries, such as an article,
       * this should have a key and a given amount of entries
       * for valid BibTeX.
       */
      this.matchToken = function(pos, token) {
        var startPos = pos;
        var endPos = pos;
        var char = this.input[endPos++];
        var parts = [];

        var part;
        while (char !== token) {
          if (char === D_QUOTE) {
            part = this.matchToken(endPos, D_QUOTE);
            parts.push(part);
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === L_BRACE) {
            part = this.matchToken(endPos, R_BRACE);
            parts.push(part);
            endPos = part.endPos+1;
            startPos = endPos;
          } else if (char === COMMA) {
            parts.push({
              type: KEY_TYPE,
              part: this.input.substring(startPos, endPos-1)
            });
            startPos = endPos;
          } else if (char === EQUAL) {
            part = this.matchValue(endPos);
            parts.push({
              type: ENTRYTAG_TYPE,
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
            parts.push({
              type: KEY_TYPE,
              part: this.input.substring(startPos, endPos-1)
            });
          }
        }

        return {
          startPos: pos,
          endPos: endPos-1,
          parts: parts
        };
      };

      this.bibtex = function () {
        var parsing = {
          comments: [],
          strings: {},
          entries: [],
          preambles: []
        };
        while (this.matchAt()) {
          var d = this.directive().toLowerCase();
          this.match("[{(]", 1);

          if (d == "@string") {
            banana.mergeInto(this.string().strings, parsing.strings);
          } else if (d == "@preamble") {
            parsing.preambles.push(this.preamble());
          } else if (d == "@comment") {
            parsing.comments.push(this.comment());
          } else {
            parsing.entries.push(this.entry(d));
          }
        }

        return parsing;
      };
    }

    exports.toJSON = function (input) {
      var b = new BibtexParser();
      b.setInput(input);
      var result = b.bibtex();
      return result;
    };
})(typeof exports === 'undefined' ? this['bibtexParse'] = {} : exports);
