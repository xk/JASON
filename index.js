// Copyright (c) 2012 Jorge Chamorro Bieling  <jorge@jorgechamorro.com>
// MIT License
(function (exports) {
  'use strict';
  
  var OphOP= Object.prototype.hasOwnProperty;
  function hOP (k,o) {
    return OphOP.call(o,k);
  }
  
  var builtInsPaths= [];
  var builtIns= [];
  
  var seen= [];
  var paths= [];
  var cyclic= [];
  var ademas= [];
  
  var provO= [];
  var provP= [
    'Object',
    'Function',
    'Array',
    'String',
    'Boolean',
    'Number',
    'Math',
    'Date',
    'RegExp',
    'Error',
    'JSON',
    'Object.prototype',
    'Function.prototype',
    'Array.prototype',
    'String.prototype',
    'Boolean.prototype',
    'Number.prototype',
    'Date.prototype',
    'RegExp.prototype',
    'Error.prototype'
  ];
  
  
  var i= 0;
  while (i < provP.length) {
    provO[i]= eval(provP[i]);
    i++;
  }
  
  var i= 0;
  while (i < provO.length) {
    seen= [];
    paths= [];
    cyclic= [];
    ademas= [];
    //process.stdout.write('Analizando -> '+ provP[i]+ '\n');
    
    strfy(provO[i], provP[i]);
    
    //console.log(seen);
    //console.log(paths);
    //console.log(cyclic);
    
    seen.forEach(function (v,i,o) {
      //process.stdout.write('Comprobando -> '+ paths[i]+ '\n');
      var where= provO.indexOf(v);
      if (where < 0) {
        provO.push(seen[i]);
        provP.push(paths[i]);
        //process.stdout.write('Añadido -> '+ paths[i]+ '\n');
      }
    });
    i++;
  }
  
  //console.log('\n\n\n ************ \n\n\n');
  //console.log(provP);
  //console.log('\n\n\n ************ \n\n\n');
  //console.log('DONE -> '+ provP.length);
  
  var builtInsPaths= provP;
  var builtIns= provO;
  
  exports.stringify = function(o) {
    seen= [];
    paths= [];
    cyclic= [];
    ademas= [];
    
    var r= strfy(o, 'o');
    if (cyclic.length || ademas.length) {
      return '(function(o){\n  '+ cyclic.join(';\n  ')+ ';\n  '+ ademas.join(';\n  ')+ ';\n  return o;\n})('+ r+ ');';
    }
    else {
      return r;
    }
  }
  
  function strfy (o, path) {
    function isPrimitive (type, o) {
      return ((type === 'number') || (type === 'string') || (type === 'undefined') || (o === null) || (type === 'boolean'));
    }

    var type= typeof o;
    if (isPrimitive(type, o)) {
      if (type === 'number') {
        return ''+ o;
      }

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
          else {
            oo+= o[i];
          }
          i++;
        }
        return '\"'+ oo+ '\"';
      }

      if (type === 'undefined') {
        return 'undefined';
      }

      if (type === 'boolean') {
        return o ? 'true' : 'false';
      }

      return 'null';
    }

    var where= builtIns.indexOf(o);
    if (where >= 0) {
      return builtInsPaths[where];
    }
    
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
          t.push(strfy(o[i], path+ '['+ i+ ']'));
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
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p));
      });
      
      
      return '['+ t.join(',')+ ']';
    }

    //functions
    if (type === 'function') {
      var defaultKeys= Object.getOwnPropertyNames(function(){});
      var keys= Object.getOwnPropertyNames(o).filter(function (v,i,o) {
        return (defaultKeys.indexOf(v) < 0);
      });
      
      keys.forEach(function (k) {
        var p= '[\"'+ k+ '\"]';
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p));
      });
      
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
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p));
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
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p));
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
        ademas.push(path+ p+ '= '+ strfy(o[k], path+ p));
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
      t.push('\"'+ k+ '\":'+ strfy(o[k], path+ '[\"'+ k+ '\"]'));
    });
    return '{'+ t.join(',')+ '}';
  }
  
  
  exports.parse = function(t) {
    return eval( '('+ t+ ')' );
  }
})(typeof exports !== 'undefined' ? exports : (window.JASON = window.JASON || {}));