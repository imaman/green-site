var escape = require('escape-html');

(function() {
  function Translator(input) {
    this.input = input;
    this.offset = 0;
    this.output = [];
    this.stack = [];
  }

  Translator.prototype.toString = function() {
    return this.input.substring(this.offset);
  }

  function chars(arr) {
    var s = arr.join("");
    s = escape(s);
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  Translator.prototype.transition = function(tag, props, s) {
    console.log('----------------------processing: ' + s);
    console.log("STACK BEFORE: " + this.stack);
    this.transitionPrime(tag, props, s);
    console.log(" STACK AFTER: " + this.stack);
    console.log("");
  }
  Translator.prototype.transitionPrime = function(tag, props, s) {
    for (var i = this.stack.length - 1; i >= 0; --i)  {
      var current = this.stack[i];
      if (current.constructor == Node) {
        continue;
      }

      if (current === s) {
        console.log('>>> splicing: ' + s);
        var n = new Node(tag, props, s);
        for (var j = i + 1; j < this.stack.length; ++j) {
          n.withKid(this.stack[j]);
        }

        this.stack.splice(i, this.stack.length - i);
        this.stack.push(n);
        return;
      }
    }
    

    console.log('>>> pushing: ' + s);
    this.stack.push(s);
  }

  Translator.prototype.hasMore = function() {
    return this.offset < this.input.length;
  }

  Translator.prototype.head = function() {
    return this.input[this.offset];
  }

  Translator.prototype.step = function(amount) {
    this.offset += amount;
  }

  Translator.prototype.consume = function(s) {
    if (this.consumeIf(s)) {
      return;
    }

    throw new Error('expected "' + s + '"');
  }

  Translator.prototype.headIs = function(s) {
    if (!this.hasMore()) {
      return false;
    }

    var tail = this.input.substring(this.offset);
    if (tail.length < s.length) {
      return false;
    }

    tail = tail.substring(0, s.length);
    return (tail === s);
  }

  Translator.prototype.consumeIf = function(s) {
    if (!this.headIs(s)) {
      return false;
    }

    this.step(s.length);
    return true;
  }

  function Node(tag_, props_) {
    if (arguments.length == 1) {
      this.tag = null;
      this.props_ = null;
      this.kids = [];
      this.value = tag_;
    } else {
      this.tag = tag_;
      this.props = props_;
      this.kids = [];
    }
  }

  Node.prototype.toString = function() {
    return 'Node(' + this.tag + ',' + this.value + ')';
  }

  Node.prototype.withKid = function(n) {
    this.kids.push(n);
    return this;
  }

  Node.prototype.dump = function(buff, depth) {
    for (var i = 0; i < depth; ++i) {
      buff.push("  ");
    }
    buff.push('|');

    if (this.value) {
      buff.push(this.value);
      buff.push("\n");
      return;
    }

    buff.push(this.tag);
    buff.push("\n");
    this.kids.forEach(function(current) {
      current.dump(buff, depth + 1);
    });
  }

  Node.prototype.toHtml = function(buffer) {
    if (this.value) {
      buffer.push(this.value);
      return;
    }

    var attributes = Object.keys(this.props || {}).map(function(k) {
      return ' ' + k + '="' + this[k] + '"';
    }, this.props).join('');
    this.tag && buffer.push('<' + this.tag + attributes + '>');
    this.kids.forEach(function(current) {
      current.toHtml(buffer);
    });
    this.tag && buffer.push('</' + this.tag + '>');
  }

  // doc -> segment*
  // segment -> strong | code
  // strong -> "**" strong "**" | emph
  // emph -> "*" emph "*" | plain
  // plain -> [A-Za_z0-9]+
  
  Translator.prototype.translate = function() {
    var result = new Node();
    while (this.hasMore()) {
      result.withKid(this.segment());
    }

    return result; 
  }

  Translator.prototype.segment = function() {
    if (this.consumeIf('`')) {
      return this.code();
    }
    return this.strong();
  }

  Translator.prototype.strong = function() {
    while(this.hasMore()) {
      console.log(this.toString());
      if (this.consumeIf('`')) {
        this.stack.push(this.code());
      } else if (this.consumeIf('**')) {
        this.transition('strong', {}, '**');
      }
      else if (this.consumeIf('*')) {
        this.transition('em', {}, '*');
      }
      else {
        this.stack.push(this.plain());
      }
    }


    var root = new Node();
    this.stack.forEach(function(v) {
      root.withKid(v);
    });

    return root;
  }

  Translator.prototype.emph = function() {
    if (this.consumeIf('*')) {
      var n = this.emph();
      this.consume('*');
      return new Node('em', {}).withKid(n);
    }

    return this.plain();
  }

  Translator.prototype.plain = function() {
    var arr = [];
    while (this.hasMore()) {
      if (this.headIs('*') || this.headIs('`')) {
        break;
      }
      
      arr.push(this.head());
      this.step(1);
    }
    return new Node(chars(arr));
  }

  Translator.prototype.code = function() {
    var arr = [];
    while (this.hasMore()) {
      if (this.consumeIf('`')) {
        break;
      }
      
      arr.push(this.head());
      this.step(1);
    }
    return new Node('pre', {class: 'code'}).withKid(new Node(arr.join('')));
  }

  exports.toHtml = function(input) {
    var translator = new Translator(input);
    var root = translator.translate();

    var dbg = [];
    root.dump(dbg, 0);
    console.log("\n\n In: " + input + "\nOut:\n" + dbg.join(""));

    var buffer = [];
    root.toHtml(buffer);

    return buffer.join('');
  }
})();


