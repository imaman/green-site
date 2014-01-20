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

  Translator.prototype.consumeIf = function(s) {
    if (!this.hasMore()) {
      return false;
    }

    var tail = this.input.substring(this.offset);
    if (tail.length < s.length) {
      return false;
    }

    tail = tail.substring(0, s.length);
    if (tail === s) {
      this.step(s.length);
      return true;
    }

    return false;
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

  Translator.prototype.translate = function() {
    while (this.hasMore()) {
      if (this.consumeIf('`')) {
        this.code();
      }
      
      this.emit(escape(this.head()));
      this.step(1);
    }
  }

  exports.toHtml = function(input) {
    var translator = new Translator(input);
    translator.translate();

    return translator.output.join('');
  }
})();


