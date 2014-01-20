var markdown = require('../markdown');

describe('markdown', function() {
  it('keeps plain text as-is', function() {
    expect(markdown.toHtml('some plain text')).toEqual('some plain text');    
  });

  it('translates backticks to <pre>', function() {
    expect(markdown.toHtml('abc `some code` def')).toEqual('abc <pre class="code">some code</pre> def');
  });
  it('escapes less than and greater than', function() {
    expect(markdown.toHtml('<><<>>')).toEqual('&lt;&gt;&lt;&lt;&gt;&gt;');
  });
});
