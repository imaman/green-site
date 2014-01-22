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

    it('stars become italics', function() {
      expect(markdown.toHtml('abc *def* ghi')).toEqual('abc <em>def</em> ghi');
    });

    it('double-stars become bold', function() {
      expect(markdown.toHtml('abc **def** ghi')).toEqual('abc <strong>def</strong> ghi');
    });

    it('< and > are escaped', function() {
      expect(markdown.toHtml('<><<>>')).toEqual('&lt;&gt;&lt;&lt;&gt;&gt;');
    });
  });
});
