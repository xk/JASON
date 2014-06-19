JASON = require '../'
should = require 'should'

describe 'primitives', ->
  it 'should handle ints', ->
    o = 27
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle null', ->
    o = null
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle undefined', ->
    o = undefined
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle strings', ->
    o = "\\string\n\t\r\""
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle boolean', ->
    o = true
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

    o = false
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

describe 'standard built-in types', ->
  it 'should handle regexes', ->
    o = /a/
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

    o = /a/g
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle regexes', ->
    o = new Date()
    stringified = JASON.stringify(o)
    should(o).eql(JASON.parse(stringified))

  it 'should handle objects', ->
    o = {}
    stringified = JASON.stringify(o)
    stringified.should.eql '{}'
    should(o).eql(JASON.parse(stringified))

  it 'should handle arrays', ->
    o = []
    stringified = JASON.stringify(o)
    stringified.should.eql '[]'
    should(o).eql(JASON.parse(stringified))

  it 'should handle arrays w/ holes', ->
    o = `[, ]`
    stringified = JASON.stringify(o)
    stringified.should.eql '[,]'
    should(o).eql(JASON.parse(stringified))

    o = `[,,]`
    stringified = JASON.stringify(o)
    stringified.should.eql '[,,]'
    should(o).eql(JASON.parse(stringified))

  it 'should handle mixed objects', ->
    o = [
      27
      null
      undefined
      "string"
      true
      false
      {}
      []
      `[,]`
      `[,,]`
    ]
    stringified = JASON.stringify(o)
    stringified.should.eql(
      '[27,null,undefined,\"string\",true,false,{},[],[,],[,,]]'
    )
    should(o).eql(JASON.parse(stringified))

  it 'should handle anon functions', ->
    o = (->)
    stringified = JASON.stringify(o)
    stringified.should.eql '(function () {})'

  it 'should handle named functions', ->
    `function namedFunction() {}`
    o = namedFunction
    stringified = JASON.stringify(o)
    stringified.should.eql 'function namedFunction() {}'

  it 'should handle named functions in various objects', ->
    `function namedFunction() {}`
    o = [namedFunction]
    stringified = JASON.stringify(o)
    stringified.should.eql '[function namedFunction() {}]'

    o = [namedFunction, ->]
    stringified = JASON.stringify(o)
    stringified.should.eql '[function namedFunction() {},(function () {})]'

    o = fn: namedFunction
    stringified = JASON.stringify(o)
    stringified.should.eql '{"fn":function namedFunction() {}}'

describe 'cyclic', ->
  it 'should handle multiple array keys referencing the same function', ->
    `function fn() {}`
    o = [fn, fn]
    stringified = JASON.stringify(o)
    stringified.should.eql """
    (function(o){
    /* Cyclic properties */
    o[1]= o[0];
    return o;
    })([function fn() {},"&o[0]"])
    """
    parsed = JASON.parse(stringified)
    parsed.should.be.instanceOf(Array)
    parsed[0].should.eql parsed[1]
    parsed[0].name.should.eql 'fn'
    parsed[1].name.should.eql 'fn'
    parsed[0].should.be.type 'function'
    parsed[1].should.be.type 'function'

  it 'should handle multiple properties referencing the same function', ->
    `function fn() {}`
    o =
      a: fn
      b: fn
    stringified = JASON.stringify(o)
    stringified.should.eql """
    (function(o){
    /* Cyclic properties */
    o["b"]= o["a"];
    return o;
    })({"a":function fn() {},"b":"&o[a]"})
    """
    parsed = JASON.parse(stringified)
    parsed.should.be.type 'object'
    parsed['a'].should.eql parsed['b']
    parsed['a'].name.should.eql 'fn'
    parsed['b'].name.should.eql 'fn'
    parsed['a'].should.be.type 'function'
    parsed['b'].should.be.type 'function'


  it 'should handle self-referencing objects', ->
    `function fn() {}`
    o =
      a: fn
      b: fn
    o = [
      o
      fn
      [
        o
        fn
      ]
    ]
    stringified = JASON.stringify(o)
    stringified.should.eql """
    (function(o){
    /* Cyclic properties */
    o[0]["b"]= o[0]["a"];
    o[1]= o[0]["a"];
    o[2][0]= o[0];
    o[2][1]= o[0]["a"];
    return o;
    })([{"a":function fn() {},"b":"&o[0][a]"},"&o[0][a]",["&o[0]","&o[0][a]"]])
    """
    parsed = JASON.parse(stringified)
    parsed.should.be.instanceOf(Array)
    parsed[0].should.be.type 'object'
    parsed[1].should.be.type 'function'
    parsed[1].name.should.eql 'fn'
    parsed[2].should.be.instanceOf(Array)
    parsed[0].should.eql parsed[2][0]
    parsed[1].should.eql parsed[2][1]
    parsed[0].a.should.eql parsed[0].b
    parsed[0].a.should.eql parsed[1]
    parsed[0].a.should.eql parsed[2][1]

describe 'built-ins', ->
  it 'should handle built-ins', ->
    o = [
      Object
      Array
      Object.prototype
      Array::push
    ]
    stringified = JASON.stringify(o)
    parsed = JASON.parse(stringified)
    parsed.should.eql o

describe 'misc', ->
  it 'should reset additional properties between calls', ->
    `function fn() {}`
    fn.k = 27
    o = fn
    stringified = JASON.stringify(o)
    parsed = JASON.parse(stringified)
    should(parsed.k).eql 27

    delete fn.k
    o = fn
    stringified = JASON.stringify(o)
    parsed = JASON.parse(stringified)
    should(parsed.k).eql undefined
