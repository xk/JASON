// Copyright (c) 2011 Jorge Chamorro Bieling  <jorge@jorgechamorro.com>
// MIT License

(function (exports) {
  'use strict';

  var builtInPaths= [
    'Array',          'Array.prototype',
    'Boolean',        'Boolean.prototype',
    'Date',           'Date.prototype',
    'Error',          'Error.prototype',
    'EvalError',      'EvalError.prototype',
    'Function',       'Function.prototype',
    'Map',            'Map.prototype',
    'Number',         'Number.prototype',
    'Object',         'Object.prototype',
    'Proxy',          'Proxy.prototype',
    'RangeError',     'RangeError.prototype',
    'ReferenceError', 'ReferenceError.prototype',
    'RegExp',         'RegExp.prototype',
    'Set',            'Set.prototype',
    'String',         'String.prototype',
    'SyntaxError',    'SyntaxError.prototype',
    'TypeError',      'TypeError.prototype',
    'URIError',       'URIError.prototype',
    'WeakMap',        'WeakMap.prototype',
    
    'Math', 'JSON', 'eval',
    
    'decodeURI',  'decodeURIComponent',
    'encodeURI',  'encodeURIComponent',
    'escape',     'unescape',
    'isFinite',   'isNaN',
    'parseFloat', 'parseInt'
  ];
  var builtInObjects= builtInPaths.map(function (v,i,o) {
    'use strict';
    return eval(v);
  });

  var seen, paths, i= 0;
  while (i < builtInObjects.length) {
    //process.stdout.write('Analizando -> '+ builtInPaths[i]+ '\n');
    
    strfy(builtInObjects[i], builtInPaths[i], [], [], seen= [], paths= [], [], []);
    
    //console.log(seen);
    //console.log(paths);
    
    seen.forEach(function (v,i,o) {
      'use strict';
      //process.stdout.write('Comprobando -> '+ paths[i]+ '\n');
      var where= builtInObjects.indexOf(v);
      if (where < 0) {
        builtInPaths.push(paths[i]);
        builtInObjects.push(seen[i]);
        //process.stdout.write('Añadido -> '+ paths[i]+ '\n');
      }
    });
    i++;
  }

  //console.log('\n\n\n ************ \n\n\n');
  //console.log(builtInPaths);
  //console.log('\n\n\n ************ \n\n\n');
  //console.log('DONE -> '+ builtInPaths.length);

  seen= paths= null;

  function stringify (o) {
    'use strict';
    var cyclic, ademas;
    var r= strfy(o, 'o', builtInObjects, builtInPaths, [], [], cyclic= [], ademas= []);
    
    if (cyclic.length || ademas.length) {
      
      var txt= '(function(o){\n';
      
      if (ademas.length) {
        txt+= "//Additional properties\n"+ ademas.join(';\n');
      }
      
      if (cyclic.length) {
        txt+= "//Cyclic properties\n"+ cyclic.join(';\n');
      }
      
      return txt+ '\nreturn o;\n})('+ r+ ')';
    }
    
    return r;
  }


  function isPrimitive (type, o) {
    'use strict';
    return ((type === 'number') || (type === 'string') || (type === 'undefined') || (o === null) || (type === 'boolean'));
  }


  function strfy (o, path, builtInObjects, builtInPaths, seen, paths, cyclic, ademas) {
    'use strict';
    
    var type= typeof o;
    if (isPrimitive(type, o)) {
      if (type === 'number') return ''+ o;
      if (type === 'undefined') return 'undefined';
      if (type === 'boolean') return o ? 'true' : 'false';
      if (type === 'string') {
        var i= 0;
        var oo= '';
        while (i < o.length) {
          var char= o.charCodeAt(i);
          if (char < 32) {
            char= char.toString(16);
            if (char.length < 2) char= '0'+ char;
            oo+= '\\x'+ char;
          }
          else if (char === 34) {
            oo+= '\\"';
          }
          else if (char === 91) {
            oo+= '\\\\';
          }
          else {
            oo+= o[i];
          }
          i++;
        }
        return '\"'+ oo+ '\"';
      }

      return 'null';
    }

    var where= builtInObjects.indexOf(o);
    if (where >= 0) return builtInPaths[where];
    
    where= seen.indexOf(o);
    if (where >= 0) {
      //console.log('*** SEEN   -> '+ paths[where]);
      cyclic.push(path+ '= '+ paths[where]);
      return '\"'+ paths[where].replace(/\"/g, '')+ '\"';
    }
    else {
      //console.log('*** Unseen -> '+ path);
      seen.push(o);
      paths.push(path);
    }

    //Arrays
    if (Array.isArray(o)) {
      var i= 0;
      var t= [];
      var defaultKeys= Object.getOwnPropertyNames([]);
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      while (i < o.length) {
        var where= keys.indexOf(''+ i);
        if (where >= 0) {
          delete keys[where];
          t.push(strfy(o[i], path+ '['+ i+ ']', builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
        }
        else {
          t.push('');
        }
        i++;
      }

      if (t.length && (t[t.length- 1] === '')) {
        t.push('');
      }

      //Propiedades adicionales
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p, builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
      });
      
      
      return '['+ t.join(',')+ ']';
    }

    //functions
    if (type === 'function') {
      var defaultKeys= Object.getOwnPropertyNames(function(){});
      var nativeCode = (Object+'').replace('Object','');
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p, builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
      });
      
      if ((o+'').replace(o.name,'') === nativeCode) {
        return (o+'').replace(/(\[native code\])/, '"$1";');
      }
      
      return (o.name) ? ''+ o : '('+ o+ ')';
    }

    //Dates
    if (Date.prototype.isPrototypeOf(o)) {
      var defaultKeys= Object.getOwnPropertyNames(new Date());
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p, builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
      });
      
      return 'new Date('+ (+o)+ ')';
    }

    //Booleans
    if (Boolean.prototype.isPrototypeOf(o)) {
      var defaultKeys= Object.getOwnPropertyNames(new Boolean());
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p, builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
      });
      
      return ''+ o;
    }

    //RegExps
    if (RegExp.prototype.isPrototypeOf(o)) {
      var defaultKeys= Object.getOwnPropertyNames(/a/);
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p, builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
      });
      
      return ''+ o;
    }

    //Objects
    var defaultKeys= Object.getOwnPropertyNames({});
    var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
      return (defaultKeys.indexOf(v) < 0);
    });

    var t= [];
    keys.forEach(function (k) {
      t.push('\"'+ k+ '\":'+ strfy(o[k], path+ '[\"'+ k+ '\"]', builtInObjects, builtInPaths, seen, paths, cyclic, ademas));
    });
    return '{'+ t.join(',')+ '}';
  }


  function parse (t) {
    return eval( '('+ t+ ')' );
  }
  
  exports.stringify= stringify;
  exports.parse= parse;
  
})(typeof exports !== 'undefined' ? exports : (window.JASON = window.JASON || {}));