

var JASON = require('JASON');

function assert (c,d) {
	if (c === d || (d === undefined && !!c === true)) {
  	console.log("ASSERTION -> OK");
  	
  } else if (c !== d) {
  	var err = new Error("Assertion FAILED");
  	var info = err.stack.split('\n').slice(2,3)[0].slice(0,-1).split(':').slice(-2);
  	err.stack = [
  		'            '+{}.toString.call(c),
  		'____________________________________',
  		'',
  		c,
  		'',
  		'------------- NOT EQUAL ------------',
  		'',
  		d,
  		'',
  		'_____________________________________',
  		'            '+{}.toString.call(d),
  		'',
  		'Line ' + info[0] + ', Column ' + info[1]
  	].join('\n')
  	throw err;
  }
}


//Primitives
console.log("\n\n******* Primitives\n\n");

var o= 27;
var oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));


o= null;
oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));


o= undefined;
oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));


o= 'string\n\t\r"';
oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));


o= true;
oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));


o= false;
oo= JASON.stringify(o);
console.log(o,oo);
assert(o, JASON.parse(oo));

//Standard built-in types
console.log("\n\n******* STANDARD BUILT-IN TYPES\n\n");

o= /a/;
oo= JASON.stringify(o);
console.log(o,oo);
assert(o.toString(), eval(JASON.parse(oo)).toString());


o= new Date();
oo= JASON.stringify(o);
console.log(o,oo);
assert(+o, +JASON.parse(oo));


o= {};
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '{}');

o= [];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[]');


o= [,];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[,]');


o= [,,];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[,,]');


o= [27,null,undefined,"string",true,false,{},[],[,],[,,]];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[27,null,undefined,"string",true,false,{},[],[,],[,,]]');


o= function(){};
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '(function (){})');

function ƒ (){};
o= ƒ;
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, 'function ƒ(){}');


o= [ƒ,];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[function ƒ(){}]');


o= [ƒ,function(){},];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '[function ƒ(){},(function (){})]');


o= {ƒ:ƒ};
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '{"ƒ":function ƒ(){}}');

//Cyclic
console.log("\n\n******* CYCLIC\n\n");

o= [ƒ,ƒ];
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '(function(o){\n  o[1]= o[0];\n  ;\n  return o;\n})([function ƒ(){},"o[0]"]);');
oo= eval(oo);
assert(oo[0], oo[1]);

o= {a:ƒ, b:ƒ};
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '(function(o){\n  o["a"]= o["b"];\n  ;\n  return o;\n})({"b":function ƒ(){},"a":"o[b]"});');
oo= eval(oo);
assert(oo.a, oo.b);
assert(oo.a.name, "ƒ");


o= [o,ƒ,[o,ƒ]];
oo= JASON.stringify(o);
console.log(o,oo);
oo= eval(oo);
assert(oo[0], oo[2][0]);
assert(oo[1], oo[2][1]);
assert((oo[0].a === oo[0].b) && (oo[0].a === oo[1]) && (oo[0].a, oo[2][1]));

//Built-ins
console.log("\n\n******* BUILT-INS\n\n");

o= [Object, Array, Object.prototype, Array.prototype.push];
oo= JASON.stringify(o);
console.log(o,oo);
oo= eval(oo);
assert(oo[0], Object);
assert(oo[1], Array);
assert(oo[2], Object.prototype);
assert(oo[3], Array.prototype.push);

//Additional properties

//Issue #1 BEGIN
console.log("\n\n******* Issue #1\n\n");

ƒ.k= 27;
o= ƒ;
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, '(function(o){\n  ;\n  o["k"]= 27;\n  return o;\n})(function ƒ(){});');


delete ƒ.k;
o= ƒ;
oo= JASON.stringify(o);
console.log(o,oo);
assert(oo, 'function ƒ(){}');

//Issue #1 END
