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

  Translator.prototype.emit = function(s) {
    this.output.push(s);
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

  Translator.prototype.translate = function() {
    while (this.hasMore()) {
      this.segment();
    }
  }

  Translator.prototype.segment = function() {
    if (this.consumeIf('`')) {
      this.code();
      return;
    }
    if (this.consumeIf('*')) {
      this.emit('<em>');
      this.emit(this.plainText());
      this.consume('*');
      this.emit('</em>');
      return;
    }

    this.emit(this.plainText());
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
    return escape(arr.join(""));
  }

  Translator.prototype.code = function() {
    this.emit('<pre class="code">');
    while (this.hasMore()) {
      if (this.consumeIf('`')) {
        break;
      }
      
      this.emit(this.head());
      this.step(1);
    }
    this.emit('</pre>');
  }

  exports.toHtml = function(input) {
    var translator = new Translator(input);
    translator.translate();

    return translator.output.join('');
  }
})();


