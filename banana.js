module.exports = (function() {
  var processArray = function(items, process) {
    var todo = items.concat();

    if (todo.length > 0) {
      setTimeout(function() {
        process(todo.shift());
        if(todo.length > 0) {
          setTimeout(arguments.callee, 25);
        }
      }, 25);
    }
  };

  /**
   * Deep merging the first object into the second, overwriting pre-existing keys
   */
  var mergeInto = function(source, target) {
    for (var attr in source) {
      if (target[attr]) {
        mergeInto(source[attr], target[attr]);
      } else {
        target[attr] = source[attr];
      }
    }
  };

  return {
    processArray: processArray,
    mergeInto: mergeInto
  };
})();
