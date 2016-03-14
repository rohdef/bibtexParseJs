const fs = require("fs");
const parser = require("../bibtexParse.js");

describe("When parsing strings it", function() {
  var bibtexData;

  beforeAll(function(done) {
    fs.readFile("./tests/resources/strings.bib", function(error, data) {
      if (error) {
        console.err(error);
      } else {
        bibtexData = data.toString();
      }
      done();
    });
  });

  it("should contain default strings", function() {
    var bibtex = parser.toJSON(bibtexData);

    expect(bibtex.strings).toBeDefined();
    expect(bibtex.strings.jan).toBeDefined();
    expect(bibtex.strings.feb).toBeDefined();
    expect(bibtex.strings.mar).toBeDefined();
    expect(bibtex.strings.apr).toBeDefined();
    expect(bibtex.strings.jun).toBeDefined();
    expect(bibtex.strings.jul).toBeDefined();
    expect(bibtex.strings.aug).toBeDefined();
    expect(bibtex.strings.sep).toBeDefined();
    expect(bibtex.strings.oct).toBeDefined();
    expect(bibtex.strings.nov).toBeDefined();
    expect(bibtex.strings.dec).toBeDefined();
  });

  it("should have a toString that can print the textual representation of a string", function() {
    var bibtex = parser.toJSON(bibtexData);

    expect(bibtex.strings).toBeDefined();
    expect(bibtex.strings.toString).toBeDefined();

    var strings = bibtex.strings;
    expect(typeof strings.toString).toEqual("function");
    expect(strings.toString(strings.magritte))
      .toEqual("Ceci n'est pas une pipe");
    expect(strings.toString(strings.pratchett))
      .toEqual("Give a man a fire and he's warm for a day, "
               + "but set fire to him and he's warm for the rest of his life");
    expect(strings.toString(strings.olivier))
      .toEqual("'Ceci n'est pas une pipe' is a wonderful quote");
  });

  it("should give a map containing the strings and values", function() {
    var bibtex = parser.toJSON(bibtexData);

    expect(bibtex.strings).toBeDefined();

    var magritte = bibtex.strings.magritte;
    var pratchett = bibtex.strings.pratchett;
    var olivier = bibtex.strings.olivier;
    expect(magritte).toBeDefined();
    expect(pratchett).toBeDefined();
    expect(olivier).toBeDefined();

    expect(magritte.length).toBe(1);
    expect(pratchett.length).toBe(2);
    expect(olivier.length).toBe(3);

    expect(magritte[0].type).toEqual(parser.types.TEXT_TYPE);

    expect(pratchett[0].type).toEqual(parser.types.TEXT_TYPE);
    expect(pratchett[1].type).toEqual(parser.types.TEXT_TYPE);

    expect(olivier[0].type).toEqual(parser.types.TEXT_TYPE);
    expect(olivier[1].type).toEqual(parser.types.STRING_TYPE);
    expect(olivier[2].type).toEqual(parser.types.TEXT_TYPE);
  });

  it("should handle content with only a string and strings at the edges", function() {
    var bibtex = parser.toJSON(bibtexData);

    var m1 = bibtex.strings.m1;
    var m2 = bibtex.strings.m2;
    var m3 = bibtex.strings.m3;
    expect(m1).toBeDefined();
    expect(m2).toBeDefined();
    expect(m3).toBeDefined();

    expect(m1.length).toBe(1);
    expect(m2.length).toBe(2);
    expect(m3.length).toBe(2);

    expect(m1[0].type).toEqual(parser.types.STRING_TYPE);
    expect(m2[0].type).toEqual(parser.types.TEXT_TYPE);
    expect(m2[1].type).toEqual(parser.types.STRING_TYPE);
    expect(m3[0].type).toEqual(parser.types.STRING_TYPE);
    expect(m3[1].type).toEqual(parser.types.TEXT_TYPE);

    expect(m1[0].part).toEqual("jan");
    expect(m2[1].part).toEqual("feb");
    expect(m3[0].part).toEqual("mar");
  });

  it("should prevent cyclic references in toString", function() {
    var bibtex = parser.toJSON(bibtexData);
    var strings = bibtex.strings;

    expect(function() {
      strings.toString(strings.cyclic1);
    }).toThrow("Cyclic call detected");

    expect(function() {
      strings.toString(strings.cyclic2);
    }).toThrow("Cyclic call detected");
  });

  it("should give errors when referencing undefined strings in toString", function() {
    var bibtex = parser.toJSON(bibtexData);
    var strings = bibtex.strings;

    expect(function() {
      strings.toString(strings.badreference);
    }).toThrow("Undefined string: [nonexisting] was referenced");
  });

  it("should take care of letter cases in toString", function() {
    var bibtex = parser.toJSON(bibtexData);
    var strings = bibtex.strings;

    expect(strings.toString(strings.camelcase)).toEqual("CaMeL cAsE");
    expect(strings.toString(strings.hascamelcase)).toEqual("CaMeL cAsE");
  });
});
