var markdown = require('../markdown');

describe('markdown', function() {
  it('keeps plain text as-is', function() {
    expect(markdown.toHtml('some plain text')).toEqual('some plain text');    
  });

  it('translates backticks to <pre>', function() {
    expect(markdown.toHtml('abc `some code` def')).toEqual('abc <pre class="code">some code</pre> def');
  });

  it('translates backticks at EOL', function() {
    expect(markdown.toHtml('abc `some code`')).toEqual('abc <pre class="code">some code</pre>');
  });

  it('translates stars to italics', function() {
    expect(markdown.toHtml('abc *def* ghi')).toEqual('abc <em>def</em> ghi');
  });

  it('translates double-stars to bold', function() {
    expect(markdown.toHtml('abc **def** ghi')).toEqual('abc <strong>def</strong> ghi');
  });

  it('escapes less than and greater than', function() {
    expect(markdown.toHtml('<><<>>')).toEqual('&lt;&gt;&lt;&lt;&gt;&gt;');
  });
});
