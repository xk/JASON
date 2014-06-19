'use strict';

var builtInObjects = [];
var builtInPaths = [
  'Object', 'Object.prototype',
  'Array', 'Array.prototype',
  'Function', 'Function.prototype',
  'Date', 'Date.prototype',
  'RegExp', 'RegExp.prototype',
  'Number', 'Number.prototype',
  'Boolean', 'Boolean.prototype',
  'String', 'String.prototype',
  'Math',
  'JSON',
  'eval',
  'decodeURI', 'decodeURIComponent',
  'encodeURI', 'encodeURIComponent',
  'escape', 'unescape',
  'isFinite', 'isNaN',
  'parseFloat', 'parseInt',
  'Error', 'Error.prototype',
  'URIError', 'URIError.prototype',
  'TypeError', 'TypeError.prototype',
  'EvalError', 'EvalError.prototype',
  'RangeError', 'RangeError.prototype',
  'SyntaxError', 'SyntaxError.prototype',
  'ReferenceError', 'ReferenceError.prototype',
  'Map', 'Map.prototype',
  'Proxy', 'Proxy.prototype',
  'Set', 'Set.prototype',
  'WeakMap', 'WeakMap.prototype'
].filter(function(v, i, o) {
  try {
    builtInObjects.push(eval(v));
    return true;
  } catch (e) {
    return false;
  }
});

var seen, paths, i = 0;
while (i < builtInObjects.length) {
  strfy(builtInObjects[i], builtInPaths[i], [], [], seen = [], paths = [], [], []);

  seen.forEach(function(v, i, o) {
    var where = builtInObjects.indexOf(v);
    if (where < 0) {
      builtInPaths.push(paths[i]);
      builtInObjects.push(seen[i]);
    }
  });
  i++;
}

seen = paths = null;

function strfy(o, path, builtInObjects, builtInPaths, seen, paths, cyclic,
  ademas) {

  function isPrimitive(type, o) {
    return ((type === 'number') || (type === 'string') || (type ===
      'undefined') || (o === null) || (type === 'boolean'));
  }

  var type = typeof o;
  if (isPrimitive(type, o)) {
    if (type === 'number') return '' + o;
    if (type === 'undefined') return 'undefined';
    if (type === 'boolean') return o ? 'true' : 'false';
    if (type === 'string') {
      var i = 0;
      var oo = '';
      while (i < o.length) {
        var char = o.charCodeAt(i);
        if (char < 32) {
          char = char.toString(16);
          if (char.length < 2) char = '0' + char;
          oo += '\\x' + char;
        } else if (char === 34) {
          oo += '\\"';
        } else if (char === 92) {
          oo += '\\\\';
        } else {
          oo += o[i];
        }
        i++;
      }
      return '"' + oo + '"';
    }

    return 'null';
  }

  var where = builtInObjects.indexOf(o);
  if (where >= 0) return builtInPaths[where];

  where = seen.indexOf(o);
  if (where >= 0) {
    cyclic.push(path + '= ' + paths[where]);
    return '"&' + paths[where].replace(/\"/g, '') + '"';
  } else {
    seen.push(o);
    paths.push(path);
  }

  //Arrays
  if (Array.isArray(o)) {
    var i = 0;
    var t = [];
    var defaultKeys = Object.getOwnPropertyNames([]);
    var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    while (i < o.length) {
      var where = keys.indexOf('' + i);
      if (where >= 0) {
        delete keys[where];
        t.push(strfy(o[i], path + '[' + i + ']', builtInObjects,
          builtInPaths, seen, paths, cyclic, ademas));
      } else {
        t.push('');
      }
      i++;
    }

    if (t.length && (t[t.length - 1] === '')) {
      t.push('');
    }

    //Propiedades adicionales
    keys.forEach(function(k) {
      var p = '[\"' + k + '\"]';
      ademas.push(path + p + '= ' + strfy(o[k], path + p, builtInObjects,
        builtInPaths, seen, paths, cyclic, ademas));
    });
    return '[' + t.join(',') + ']';
  }

  //functions
  if (type === 'function') {
    var defaultKeys = Object.getOwnPropertyNames(function() {});
    var nativeCode = (Object + '').replace('Object', '');
    var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    keys.forEach(function(k) {
      var p = '[\"' + k + '\"]';
      ademas.push(path + p + '= ' + strfy(o[k], path + p, builtInObjects,
        builtInPaths, seen, paths, cyclic, ademas));
    });

    if ((o + '').replace(o.name, '') === nativeCode) {
      return (o + '').replace(/(\[native code\])/, '"$1";');
    }
    return (o.name) ? '' + o : '(' + o + ')';
  }

  //Dates
  if (Date.prototype.isPrototypeOf(o)) {
    var defaultKeys = Object.getOwnPropertyNames(new Date());
    var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    keys.forEach(function(k) {
      var p = '[\"' + k + '\"]';
      ademas.push(path + p + '= ' + strfy(o[k], path + p, builtInObjects,
        builtInPaths, seen, paths, cyclic, ademas));
    });
    return 'new Date(' + (+o) + ')';
  }

  //Booleans
  if (Boolean.prototype.isPrototypeOf(o)) {
    var defaultKeys = Object.getOwnPropertyNames(new Boolean());
    var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    keys.forEach(function(k) {
      var p = '[\"' + k + '\"]';
      ademas.push(path + p + '= ' + strfy(o[k], path + p, builtInObjects,
        builtInPaths, seen, paths, cyclic, ademas));
    });
    return '' + o;
  }

  //RegExps
  if (RegExp.prototype.isPrototypeOf(o)) {
    var defaultKeys = Object.getOwnPropertyNames(/a/);
    var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    keys.forEach(function(k) {
      var p = '[\"' + k + '\"]';
      ademas.push(path + p + '= ' + strfy(o[k], path + p, builtInObjects,
        builtInPaths, seen, paths, cyclic, ademas));
    });
    return '' + o;
  }

  //Objects
  var defaultKeys = Object.getOwnPropertyNames({});
  var keys = Object.getOwnPropertyNames(o).filter(function(v, i, o) {
    return (defaultKeys.indexOf(v) < 0);
  });

  var t = [];
  keys.forEach(function(k) {
    t.push('\"' + k + '\":' + strfy(o[k], path + '[\"' + k + '\"]',
      builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
  });
  return '{' + t.join(',') + '}';
}

module.exports.stringify = function (o) {
  var cyclic, ademas;
  var r = strfy(o, 'o', builtInObjects, builtInPaths, [], [], cyclic = [],
  ademas = []);

  if (cyclic.length || ademas.length) {

    var txt = '(function(o){\n';

    if (ademas.length) {
      txt += "/* Additional properties */\n" + ademas.join(';\n') + ';\n';
    }

    if (cyclic.length) {
      txt += "/* Cyclic properties */\n" + cyclic.join(';\n') + ';\n';
    }

    return txt + 'return o;\n})(' + r + ')';
  }

  return r;
};

module.exports.parse = function (t) {
  var globalEval = eval;
  return globalEval('(' + t + ')');
};
