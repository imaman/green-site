var markdown = require('../markdown');

describe('markdown', function() {
  describe("translation to HTML", function() {
    it('keeps plain text as-is', function() {
      expect(markdown.toHtml('some plain text')).toEqual('some plain text');    
    });

    it('backticks become <pre>', function() {
      expect(markdown.toHtml('abc `some code` def')).toEqual('abc <pre class="code">some code</pre> def');
    });

    it('backticks at EOL', function() {
      expect(markdown.toHtml('abc `some code`')).toEqual('abc <pre class="code">some code</pre>');
    });

    it('newlines become <br>s', function() {
      expect(markdown.toHtml('abc\n*de*f\ng\n\nhi')).toEqual('abc<br><em>de</em>f<br>g<br><br>hi');
    });

    it('stars become italics', function() {
      expect(markdown.toHtml('abc *def* ghi')).toEqual('abc <em>def</em> ghi');
    });

    it('< and > are escaped', function() {
      expect(markdown.toHtml('<><<>>')).toEqual('&lt;&gt;&lt;&lt;&gt;&gt;');
    });

    it('allows nesting', function() {
      expect(markdown.toHtml('*ab**cd**ef*gh'))
          .toEqual('<em>ab<strong>cd</strong>ef</em>gh');
    });
    it('double-stars become bold', function() {
      expect(markdown.toHtml('abc **def** ghi')).toEqual('abc <strong>def</strong> ghi');
    });


  });
});
