var escape = require('escape-html');

(function() {
  function Translator(input) {
    this.input = input;
    this.offset = 0;
    this.output = [];
  }

  function chars(arr) {
    var s = arr.join("");
    s = escape(s);
    s = s.replace(/\n/g, '<br>');
    return s;
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

  Node.prototype.withKid = function(n) {
    this.kids.push(n);
    return this;
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
    if (this.consumeIf('**')) {
      var n = this.segment();
      this.consume('**');
      return new Node('strong', {}).withKid(n);
    }
    if (this.consumeIf('*')) {
      var n = this.segment();
      this.consume('*');
      return new Node('em', {}).withKid(n);
    }

    return this.plainText();
  }

  Translator.prototype.plainText = function() {
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

    var buffer = [];
    root.toHtml(buffer);

    return buffer.join('');
  }
})();


