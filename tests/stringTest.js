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

  it("should give a map containing the strings and values", function() {
    var bibtex = parser.toJSON(bibtexData);

    //console.log(bibtex);

    expect(bibtex.strings).toBeDefined();

    var magritte = bibtex.strings.magritte;
    var pratchett = bibtex.strings.pratchett;
    var olivier = bibtex.strings.olivier;
    expect(magritte).toBeDefined();
    expect(pratchett).toBeDefined();
    expect(olivier).toBeDefined();

    expect(magritte.length).toBe(1);
    expect(pratchett.length).toBe(2);

    console.log(magritte);
    console.log(pratchett);
    console.log(olivier);
  });
});
