module.exports = (function() {
  var find = function(parsedBibtex, key) {
    for (var i=0; i<parsedBibtex.entries.length; i++) {
      if (parsedBibtex.entries[i].citationKey === key)
        return parsedBibtex.entries[i];
    }

    return false;
  };

  var wrapFunction = function(fun) {
    var me = this;
    var args =  Array.prototype.slice.call(arguments, 1);

    return function() {
      fun.apply(me, args);
    };
  };

  return {
    find: find,
    wrapFunction: wrapFunction
  };
})();
