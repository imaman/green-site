var escape = require('escape-html');

(function() {
  function Translator(input) {
    this.input = input;
    this.offset = 0;
    this.output = [];
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

  function Node(tag_, props_, inner_) {
    if (arguments.length == 1) {
      this.tag = null;
      this.inner = tag_;
    } else {
      this.tag = tag_;
      this.props = props_;
      this.inner = inner_;
    }
  }

  Node.prototype.toHtml = function(buffer) {
    if (!this.tag) {
      this.inner && buffer.push(this.inner);
      return;
    }

    var s = '';
    var ps = this.props;
    this.props && Object.keys(this.props).forEach(function(k) {
      var v = ps[k];
      s += ' ' + k + '="' + v + '"';
    });
    buffer.push('<' + this.tag + s + '>');
    this.inner && this.inner.toHtml(buffer);
    buffer.push('</' + this.tag + '>');

  }

  Translator.prototype.translate = function() {
    var arr = [];
    while (this.hasMore()) {
      arr.push(this.segment());
    }

    return arr;
  }

  Translator.prototype.segment = function() {
    if (this.consumeIf('`')) {
      return this.code();
    }
    if (this.consumeIf('*')) {
      var n = this.plainText();
      this.consume('*');
      return new Node('em', {}, n);
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
    return new Node(escape(arr.join("")));
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
    return new Node('pre', {class: 'code'}, new Node(arr.join('')));
  }

  exports.toHtml = function(input) {
    var translator = new Translator(input);
    var arr = translator.translate();

    var buffer = [];
    arr.forEach(function(current) {
      current.toHtml(buffer);
    });

    return buffer.join('');
  }
})();


