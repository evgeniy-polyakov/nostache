const Nostache = require("../dist/nostache.min.js");

Nostache.options.verbose = true;

test("Simple text", async () => {
    expect(await Nostache("")()).toBe("");
    expect(await Nostache("simple text")()).toBe("simple text");
    expect(await Nostache("first line\nsecond line\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(await Nostache("first line\r\nsecond line\r\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(await Nostache(`first line
second line
third line`)()).toBe("first line\nsecond line\nthird line");
});

test("HTML tags", async () => {
    expect(await Nostache("<p>simple text</p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<p><b>simple</b> text</p>")()).toBe("<p><b>simple</b> text</p>");
});

test("HTML in logic block", async () => {
    await (expect(Nostache("<{ <p>simple text</p> }>")())).rejects.toBeInstanceOf(SyntaxError);
    expect(await Nostache("<{{ <p>simple text</p> }}>")()).toBe("<p>simple text</p>");
    await (expect(Nostache(`<{
    <p>simple text</p>
    }>`)())).rejects.toBeInstanceOf(SyntaxError);
    await (expect(Nostache("<{ <p><b>simple</b> text</p> }>")())).rejects.toBeInstanceOf(SyntaxError);
    expect(await Nostache("<{ if (true) {<p>simple text</p>} }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ if (true) {
    <p>simple text</p>
    } }>`)()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ if (true) { <p><b>simple</b> text</p> } }>")()).toBe("<p><b>simple</b> text</p>");
    expect(await Nostache("<{ if (true) }><p>simple text</p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ if (false) }>false<{}><p>simple text</p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ if (true) }>true<{}><p>simple text</p>")()).toBe("true<p>simple text</p>");
    expect(await Nostache("<{ if (true) }>true<p>simple text</p>")()).toBe("true<p>simple text</p>");
    expect(await Nostache("<{ if (false) }>false<p>simple text</p>")()).toBe("");
    expect(await Nostache("<{ if (false) {<p>error</p>} else {<p>simple text</p>} }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ if (false) {
    <p>error</p>
    } else {
    <p>simple text</p>
    } }>`)()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ let i = 0; while (i === 0) {i++; { <p>simple text</p> }}}>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ let i = 0; while (i === 0) {i++; {
    <p>simple text</p>
    }} }>`)()).toBe("<p>simple text</p>");
});

test("Text in logic block", async () => {
    await (expect(Nostache("<{>simple text<}>")())).rejects.toBeInstanceOf(SyntaxError);
    await (expect(Nostache("<{> simple text <}>")())).rejects.toBeInstanceOf(SyntaxError);
    await (expect(Nostache("<{ >simple text< }>")())).rejects.toBeInstanceOf(SyntaxError);
    await (expect(Nostache("<{ > simple text < }>")())).rejects.toBeInstanceOf(SyntaxError);
    expect(await Nostache("<{{ >simple text< }}>")()).toBe("simple text");
    expect(await Nostache("<{{  >simple text<  }}>")()).toBe("simple text");
    expect(await Nostache(`<{{
    >simple text<
    }}>`)()).toBe("simple text");
    expect(await Nostache("<{{ > simple text < }}>")()).toBe(" simple text ");
    expect(await Nostache("<{{  > simple text <  }}>")()).toBe(" simple text ");
    expect(await Nostache(`<{{
    > simple text <
    }}>`)()).toBe(" simple text ");
    expect(await Nostache("<{{>simple text<}}>")()).toBe("simple text");
    expect(await Nostache(`<{{>
    simple text
    <}}>`)()).toBe(`
    simple text
    `);
    expect(await Nostache("<{{> a<p><b>simple</b> text</p>a <}}>")()).toBe(" a<p><b>simple</b> text</p>a ");
    expect(await Nostache("<{ if (true) { > a<p>simple text</p>a < } }>")()).toBe(" a<p>simple text</p>a ");
    expect(await Nostache(`<{ if (true) { >
    _<p>simple text</p>_
    < } }>`)()).toBe(`
    _<p>simple text</p>_
    `);
    expect(await Nostache("<{ if (false) {>false<} else {> p>simple text<p <}}>")()).toBe(" p>simple text<p ");
    expect(await Nostache("<{ if (true) {>true<} }><p>simple text</p>")()).toBe("true<p>simple text</p>");
    expect(await Nostache("<{ if (false) {>false<p>simple text</p><}}>")()).toBe("");
    expect(await Nostache("<{ if (false) {><p>error</p><} else {><p>simple text</p><} }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ if (false) {>
    p>error</p
    <} else {>
    p>simple text</p
    <} }>`)()).toBe(`
    p>simple text</p
    `);
    expect(await Nostache("<{ let i = 0; while (i === 0) {i++; {>p>simple text</p<}}}>")()).toBe("p>simple text</p");
    expect(await Nostache(`<{ let i = 0; while (i === 0) {i++; {>
    p>simple text</p
    <}}}>`)()).toBe(`
    p>simple text</p
    `);
});

test("Mixed blocks", async () => {
    expect(await Nostache("<p><{ if (true) { <b>simple text</b> }}></p>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<p><{ if (true) }>simple text<{}></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<p><{ if (true) {}>simple text<{}}></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("one<{ if (true) }>simple text<{}>two")()).toBe("onesimple texttwo");
    expect(await Nostache("one<{ if (true) }> simple text <{}>two")()).toBe("one simple text two");
    expect(await Nostache("one <{ if (true) {> simple text <}}> two")()).toBe("one  simple text  two");
});

test("Nested blocks", async () => {
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b>simple text</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b>simple {= 'text' =}</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> {= 'text' =}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> {= 'text' =}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> {= 'text' =}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b>simple {~ 'text' ~}</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> {~ 'text' ~}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> {~ 'text' ~}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> {~ 'text' ~}</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");

    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b>simple text</b> }}></p> <}}>")()).toBe(" <p><b>simple text</b></p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b><{ if (true) {<i>simple</i>}}> text</b> <}}></p> <}}>")()).toBe(" <p> <b><i>simple</i> text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b><{ if (true) {><i>simple</i><}}> text</b> <}}></p> <}}>")()).toBe(" <p> <b><i>simple</i> text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> text</b> }}></p> <}}>")()).toBe(" <p><b><i>simple</i> text</b></p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b>simple {= 'text' =}</b> <}}></p> <}}>")()).toBe(" <p> <b>simple text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b><{ if (true) {><i>simple</i><}}> {= 'text' =}</b> }}></p> <}}>")()).toBe(" <p><b><i>simple</i> text</b></p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b><{ if (true) {><i>simple</i><}}> {= 'text' =}</b> <}}></p> <}}>")()).toBe(" <p> <b><i>simple</i> text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> {= 'text' =}</b> }}></p> <}}>")()).toBe(" <p><b><i>simple</i> text</b></p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b>simple {~ 'text' ~}</b> <}}></p> <}}>")()).toBe(" <p> <b>simple text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b><{ if (true) {><i>simple</i><}}> {~ 'text' ~}</b> }}></p> <}}>")()).toBe(" <p><b><i>simple</i> text</b></p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) {> <b><{ if (true) {><i>simple</i><}}> {~ 'text' ~}</b> <}}></p> <}}>")()).toBe(" <p> <b><i>simple</i> text</b> </p> ");
    expect(await Nostache("<{ if (true) {> <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> {~ 'text' ~}</b> }}></p> <}}>")()).toBe(" <p><b><i>simple</i> text</b></p> ");

    expect(await Nostache("<{ if (true) { <a>{@ a @} {= a =}</a> }}>")(1)).toBe("<a>1</a>");
    expect(await Nostache("<{ if (true) { <a><{ {@ a @} }>{= a =}</a> }}>")(2)).toBe("<a>2</a>");
    expect(await Nostache("<{ if (true) {<p>{@ a @} <a>{= a =}</a></p> }}>")(3)).toBe("<p><a>3</a></p>");
    expect(await Nostache("<{ if (true) {<p><{ {@ a @} }><a>{= a =}</a></p> }}>")(4)).toBe("<p><a>4</a></p>");
    expect(await Nostache("<{ if (true) {> {@ a @} <a>{= a =}</a> <}}>")(5)).toBe(" <a>5</a> ");
    expect(await Nostache("<{ if (true) {> <{ {@ a @} }><a>{= a =}</a> <}}>")(6)).toBe(" <a>6</a> ");
    expect(await Nostache("<{ if (true) {><p>{@ a @} <a>{= a =}</a></p> <}}>")(7)).toBe("<p><a>7</a></p> ");
    expect(await Nostache("<{ if (true) {><p><{ {@ a @} }><a>{= a =}</a></p> <}}>")(8)).toBe("<p><a>8</a></p> ");

    expect(await Nostache("<{ if (true) { <a>{@ a(p) {= p =} @} {= a(this[0]) =}</a> }}>")(1)).toBe("<a>1</a>");
    expect(await Nostache("<{ if (true) { <a><{ {@ a(p) {= p =} @} }>{= a(this[0]) =}</a> }}>")(2)).toBe("<a>2</a>");
    expect(await Nostache("<{ if (true) {<p>{@ a(p) {= p =} @} <a>{= a(this[0]) =}</a></p> }}>")(3)).toBe("<p><a>3</a></p>");
    expect(await Nostache("<{ if (true) {<p><{ {@ a(p) {= p =} @} }><a>{= a(this[0]) =}</a></p> }}>")(4)).toBe("<p><a>4</a></p>");
    expect(await Nostache("<{ if (true) {> {@ a(p) {= p =} @} <a>{= a(this[0]) =}</a> <}}>")(5)).toBe(" <a>5</a> ");
    expect(await Nostache("<{ if (true) {> <{ {@ a(p) {= p =} @} }><a>{= a(this[0]) =}</a> <}}>")(6)).toBe(" <a>6</a> ");
    expect(await Nostache("<{ if (true) {><p>{@ a(p) {= p =} @} <a>{= a(this[0]) =}</a></p> <}}>")(7)).toBe("<p><a>7</a></p> ");
    expect(await Nostache("<{ if (true) {><p><{ {@ a(p) {= p =} @} }><a>{= a(this[0]) =}</a></p> <}}>")(8)).toBe("<p><a>8</a></p> ");
});

test("Script blocks", async () => {
    expect(await Nostache(`<{ const [a,b] = this; }><script>let o = {"a": "{=a=}", "b": "{=b=}"};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<{ const [a,b] = this }><script>let o = {"a": "{=a=}"<{if (b) }>, "b": "{=b=}"<{}>};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<{ const [a,b] = this; }><script>let o = {"a": "{=a=}"<{if (!b) {
}>, "b": "{=b=}"<{
}}>};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1"};</script>`);
    expect(await Nostache(`<{ const [a] = this }><script><{if (a) {}>if (a) {console.log(a);}<{}}></script>`)(1)).toBe(`<script>if (a) {console.log(a);}</script>`);
});

test("Loops", async () => {
    expect(await Nostache("<ul><{for (let i=0; i<3; i++) {<li>{=i=}</li>} }></ul>")()).toBe("<ul><li>0</li><li>1</li><li>2</li></ul>");
    expect(await Nostache(`<table><{
for (let i=0; i<3; i++) {
    <tr><{for (let j=0; j<3; j++) {
        <td>{=i=}{=j=}</td>
    }}></tr>
}}></table>`)())
        .toBe("<table><tr><td>00</td><td>01</td><td>02</td></tr><tr><td>10</td><td>11</td><td>12</td></tr><tr><td>20</td><td>21</td><td>22</td></tr></table>");
    expect(await Nostache("<ul><{let i = 3; while (i-->0) {<li>{=i=}</li>} }></ul>")()).toBe("<ul><li>2</li><li>1</li><li>0</li></ul>");
    expect(await Nostache(`<ul><{
let i = 0;
while (true) {
    {<li>{=i=}</li>}
    if (++i>=3) break;
}}></ul>`)()).toBe("<ul><li>0</li><li>1</li><li>2</li></ul>");
});

test("Whitespace", async () => {
    expect(await Nostache(" <{ }> ")()).toBe("  ");
    expect(await Nostache(" <{ { <p>simple text</p> } }> ")()).toBe(" <p>simple text</p> ");
    expect(await Nostache(" <{ if (true) { <p>simple text</p> } }> ")()).toBe(" <p>simple text</p> ");
    expect(await Nostache(" <{ if (true) }> <p>simple text</p> <{}> ")()).toBe("  <p>simple text</p>  ");
    expect(await Nostache("<div> <{ if (true) { <p>simple text</p> } }> </div>")()).toBe("<div> <p>simple text</p> </div>");
    expect(await Nostache(" <div> <{ if (true) { <p>simple text</p> } }> </div> ")()).toBe(" <div> <p>simple text</p> </div> ");
    expect(await Nostache(" <{ if (true) { <div> <{ if (true) { <p>simple text</p> }}> </div> }}> ")()).toBe(" <div> <p>simple text</p> </div> ");
});

test("Escape", async () => {
    expect(await Nostache(`<p>"'\\"'\\<{ if (true) { <b>simple"'\\"'\\text</b> }}>\\'"\\'"</p>`)()).toBe(`<p>"'\\"'\\<b>simple"'\\"'\\text</b>\\'"\\'"</p>`);
    expect(await Nostache(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`)()).toBe(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`);
    expect(await Nostache(`\\"\\"""\\\\\\"aaa\\"\\""  "\\  \\  \\"`)()).toBe(`\\"\\"""\\\\\\"aaa\\"\\""  "\\  \\  \\"`);
    expect(await Nostache("\\`\\```\\\\\\`aaa\\`\\``  `\\  \\  \\`")()).toBe("\\`\\```\\\\\\`aaa\\`\\``  `\\  \\  \\`");
    expect(await Nostache("{~ '<{' ~}")()).toBe("<{");
    expect(await Nostache("{~ '<<{' ~}")()).toBe("<<{");
    expect(await Nostache("{~ ' <<{ ' ~}")()).toBe(" <<{ ");
    expect(await Nostache("{~ 'test<{test' ~}")()).toBe("test<{test");
    expect(await Nostache("{~ '<p><{</p>' ~}")()).toBe("<p><{</p>");
    expect(await Nostache("{~ '<p> <{ </p>' ~}")()).toBe("<p> <{ </p>");
    expect(await Nostache("{~ 'test <{ test' ~}")()).toBe("test <{ test");
    expect(await Nostache("{~ '{=' ~}")()).toBe("{=");
    expect(await Nostache("{~ '{=' ~}")()).toBe("{=");
    expect(await Nostache("{~ ' {= ' ~}")()).toBe(" {= ");
    expect(await Nostache("{~ 'test{=test' ~}")()).toBe("test{=test");
    expect(await Nostache("{~ '<p>{=</p>' ~}")()).toBe("<p>{=</p>");
    expect(await Nostache("{~ '<p> {= </p>' ~}")()).toBe("<p> {= </p>");
    expect(await Nostache("{~ 'test {= test' ~}")()).toBe("test {= test");
    expect(await Nostache("{~ '<{}>' ~}")()).toBe("<{}>");
    expect(await Nostache("{~ ' <{ }>' ~}")()).toBe(" <{ }>");
    expect(await Nostache("{~ 'test<{test}>' ~}")()).toBe("test<{test}>");
    expect(await Nostache("{~ '<p><{</p>}>' ~}")()).toBe("<p><{</p>}>");
    expect(await Nostache("{~ '<p> <{ </p>}>' ~}")()).toBe("<p> <{ </p>}>");
    expect(await Nostache("{~ 'test <{ test}>' ~}")()).toBe("test <{ test}>");
    expect(await Nostache("{~ '{==}' ~}")()).toBe("{==}");
    expect(await Nostache("{~ ' {= =}' ~}")()).toBe(" {= =}");
    expect(await Nostache("{~ 'test{=test=}' ~}")()).toBe("test{=test=}");
    expect(await Nostache("{~ '<p>{=</p>=}' ~}")()).toBe("<p>{=</p>=}");
    expect(await Nostache("{~ '<p> {= </p>=}' ~}")()).toBe("<p> {= </p>=}");
    expect(await Nostache("{~ 'test {= test=}' ~}")()).toBe("test {= test=}");
});

test("String interpolation", async () => {
    expect(await Nostache("<{const a = 10;}><div>{= `${a}px\\`` =}</div>")()).toBe("<div>10px`</div>");
    expect(await Nostache("<div>${a}px`</div>")({a: 10})).toBe("<div>${a}px`</div>");
    expect(await Nostache("<script>let a = `{= '${0}' =}`;</script>")()).toBe("<script>let a = `${0}`;</script>");
    expect(await Nostache("<script>let a = `{= `${0}` =}`;</script>")()).toBe("<script>let a = `0`;</script>");
    expect(await Nostache("<{ let a = '${0}'; }><script>let a = `{= a =}`;</script>")()).toBe("<script>let a = `${0}`;</script>");
    expect(await Nostache("<{ let a = `${0}` }><script>let a = `{= a =}`;</script>")()).toBe("<script>let a = `0`;</script>");
});

test("Output blocks", async () => {
    expect(await Nostache("{= undefined =}")()).toBe("");
    expect(await Nostache("{= null =}")()).toBe("");
    expect(await Nostache("{= 0 =}")()).toBe("0");
    expect(await Nostache("{= false =}")()).toBe("false");
    expect(await Nostache("{= '' =}")()).toBe("");
    expect(await Nostache("{= 10 =}")()).toBe("10");
    expect(await Nostache("{= 5 + 5 =}")()).toBe("10");
    expect(await Nostache("{= 'aa' =}")()).toBe("aa");
    expect(await Nostache("{= {a:'aa'}.a =}")()).toBe("aa");
    expect(await Nostache("{= (()=> 'aa')() =}")()).toBe("aa");
    expect(await Nostache("{= 10 =} {= 'aa' =}")()).toBe("10 aa");
    expect(await Nostache("<p>{= 10 =}</p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>{= 5 + 5 =}</p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>{= 'aa' =}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{= {a:'aa'}.a =}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{= (() => 'aa')() =}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{= 10 =}</p>{= 'aa' =}")()).toBe("<p>10</p>aa");
    expect(await Nostache("<{ if (true) {<p>{= 10 =}</p>}}>")()).toBe("<p>10</p>");
    expect(await Nostache("<{ if (true) {<p>{= 5 + 5 =}</p>}}>")()).toBe("<p>10</p>");
    await expect(Nostache("<{ if (true) {<p>{= 5 + 5 =}</p>{='aa'=}}}>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ if (true) {<p>{= 5 + 5 =}</p>{='aa'=}}}>")()).rejects.toThrow(">}");
    expect(await Nostache("<{ if (true) {<p>{= 5 + 5 =}</p>} {='aa'=}}>")()).toBe("<p>10</p>aa");
});

test("Unsafe output blocks", async () => {
    expect(await Nostache("{~ undefined ~}")()).toBe("undefined");
    expect(await Nostache("{~ null ~}")()).toBe("null");
    expect(await Nostache("{~ 0 ~}")()).toBe("0");
    expect(await Nostache("{~ false ~}")()).toBe("false");
    expect(await Nostache("{~ '' ~}")()).toBe("");
    expect(await Nostache("{~ 10 ~}")()).toBe("10");
    expect(await Nostache("{~ 5 + 5 ~}")()).toBe("10");
    expect(await Nostache("{~ 'aa' ~}")()).toBe("aa");
    expect(await Nostache("{~ {a:'aa'}.a ~}")()).toBe("aa");
    expect(await Nostache("{~ (()=> 'aa')() ~}")()).toBe("aa");
    expect(await Nostache("{~ 10 ~} {~ 'aa' ~}")()).toBe("10 aa");
    expect(await Nostache("<p>{~ 10 ~}</p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>{~ 5 + 5 ~}</p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>{~ 'aa' ~}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{~ {a:'aa'}.a ~}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{~ (() => 'aa')() ~}</p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>{~ 10 ~}</p>{~ 'aa' ~}")()).toBe("<p>10</p>aa");
    expect(await Nostache("<{ if (true) {<p>{~ 10 ~}</p>}}>")()).toBe("<p>10</p>");
    expect(await Nostache("<{ if (true) {<p>{~ 5 + 5 ~}</p>}}>")()).toBe("<p>10</p>");
    await expect(Nostache("<{ if (true) {<p>{~ 5 + 5 ~}</p>{~'aa'~}}}>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ if (true) {<p>{~ 5 + 5 ~}</p>{~'aa'~}}}>")()).rejects.toThrow(">}");
    expect(await Nostache("<{ if (true) {<p>{~ 5 + 5 ~}</p>} {~'aa'~}}>")()).toBe("<p>10</p>aa");
});

test("Safe output", async () => {
    expect(await Nostache(`<p>{= "<p>&'\\"" =}</p>`)()).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p>{= this[0] =}</p>`)("<p>&'\"")).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p>{= new Promise(r => r(this[0])) =}</p>`)("<p>&'\"")).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p class="{= "<p>&'\\"" =}"></p>`)()).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
    expect(await Nostache(`<p class="{= this[0] =}"></p>`)("<p>&'\"")).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
    expect(await Nostache(`<p class="{= new Promise(r => r(this[0])) =}"></p>`)("<p>&'\"")).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
});

test("Whitespace output", async () => {
    expect(await Nostache("{==}")()).toBe("");
    expect(await Nostache("{= =}")()).toBe(" ");
    expect(await Nostache("{=  =}")()).toBe("  ");
    expect(await Nostache("{= \t\n=}")()).toBe(" \t\n");
    expect(await Nostache(`{=

=}`)()).toBe(`

`);
    expect(await Nostache("{~~}")()).toBe("");
    expect(await Nostache("{~ ~}")()).toBe(" ");
    expect(await Nostache("{~  ~}")()).toBe("  ");
    expect(await Nostache("{= \t\n=}")()).toBe(" \t\n");
    expect(await Nostache(`{~

~}`)()).toBe(`

`);
    expect(await Nostache("<p>{==}</p>")()).toBe("<p></p>");
    expect(await Nostache("<p>{= =}</p>")()).toBe("<p> </p>");
    expect(await Nostache("<p>{=  =}</p>")()).toBe("<p>  </p>");
    expect(await Nostache("<p>{= \t\n=}</p>")()).toBe("<p> \t\n</p>");
    expect(await Nostache(`<p>{=

=}</p>`)()).toBe(`<p>

</p>`);
    expect(await Nostache("<p>{~~}</p>")()).toBe("<p></p>");
    expect(await Nostache("<p>{~ ~}</p>")()).toBe("<p> </p>");
    expect(await Nostache("<p>{~  ~}</p>")()).toBe("<p>  </p>");
    expect(await Nostache("<p>{= \t\n=}</p>")()).toBe("<p> \t\n</p>");
    expect(await Nostache(`<p>{~

~}</p>`)()).toBe(`<p>

</p>`);
});

test("Strings in output blocks", async () => {
    expect(await Nostache(`{= "=}" =}`)()).toBe("=}");
    expect(await Nostache(`{= '=}' =}`)()).toBe("=}");
    expect(await Nostache("{= `=}` =}")()).toBe("=}");
    expect(await Nostache(`{= "'=}\`" =}`)()).toBe("&#39;=}`");
    expect(await Nostache(`{= '"=}\`' =}`)()).toBe("&#34;=}`");
    expect(await Nostache("{= `\"=}'` =}")()).toBe("&#34;=}&#39;");
    expect(await Nostache(`{= "\\"=}\\"" =}`)()).toBe("&#34;=}&#34;");
    expect(await Nostache(`{= '\\'=}\\'' =}`)()).toBe("&#39;=}&#39;");
    expect(await Nostache("{= `\\`=}\\`` =}")()).toBe("`=}`");
    expect(await Nostache(`{= "a=}a" =}`)()).toBe("a=}a");
    expect(await Nostache(`{= 'a=}a' =}`)()).toBe("a=}a");
    expect(await Nostache("{= `a=}a` =}")()).toBe("a=}a");
    expect(await Nostache(`{= " =} " =}`)()).toBe(" =} ");
    expect(await Nostache(`{= ' =} ' =}`)()).toBe(" =} ");
    expect(await Nostache("{= ` =} ` =}")()).toBe(" =} ");
    expect(await Nostache(`{= (() => "a=}a")() =}`)()).toBe("a=}a");
    expect(await Nostache(`{= (() => 'a=}a')() =}`)()).toBe("a=}a");
    expect(await Nostache("{= (() => `a=}a`)() =}")()).toBe("a=}a");
    expect(await Nostache(`{~ "~}" ~}`)()).toBe("~}");
    expect(await Nostache(`{~ '~}' ~}`)()).toBe("~}");
    expect(await Nostache("{~ `~}` ~}")()).toBe("~}");
    expect(await Nostache(`{~ "'~}\`" ~}`)()).toBe("'~}`");
    expect(await Nostache(`{~ '"~}\`' ~}`)()).toBe("\"~}`");
    expect(await Nostache("{~ `\"~}'` ~}")()).toBe("\"~}'");
    expect(await Nostache(`{~ "\\"~}\\"" ~}`)()).toBe("\"~}\"");
    expect(await Nostache(`{~ '\\'~}\\'' ~}`)()).toBe("'~}'");
    expect(await Nostache("{~ `\\`~}\\`` ~}")()).toBe("`~}`");
    expect(await Nostache(`{~ "a~}a" ~}`)()).toBe("a~}a");
    expect(await Nostache(`{~ 'a~}a' ~}`)()).toBe("a~}a");
    expect(await Nostache("{~ `a~}a` ~}")()).toBe("a~}a");
    expect(await Nostache(`{~ " ~} " ~}`)()).toBe(" ~} ");
    expect(await Nostache(`{~ ' ~} ' ~}`)()).toBe(" ~} ");
    expect(await Nostache("{~ ` ~} ` ~}")()).toBe(" ~} ");
    expect(await Nostache(`{~ (() => "a~}a")() ~}`)()).toBe("a~}a");
    expect(await Nostache(`{~ (() => 'a~}a')() ~}`)()).toBe("a~}a");
    expect(await Nostache("{~ (() => `a~}a`)() ~}")()).toBe("a~}a");
});

test("Strings in logic blocks", async () => {
    expect(await Nostache(`<{ yield "}>" }>`)()).toBe("}>");
    expect(await Nostache(`<{ yield '}>' }>`)()).toBe("}>");
    expect(await Nostache("<{ yield `}>` }>")()).toBe("}>");
    expect(await Nostache(`<{ yield "'}>\`" }>`)()).toBe("'}>`");
    expect(await Nostache(`<{ yield '"}>\`' }>`)()).toBe("\"}>`");
    expect(await Nostache("<{ yield `\"}>'` }>")()).toBe("\"}>'");
    expect(await Nostache(`<{ yield "\\"}>\\"" }>`)()).toBe("\"}>\"");
    expect(await Nostache(`<{ yield '\\'}>\\'' }>`)()).toBe("'}>'");
    expect(await Nostache("<{ yield `\\`}>\\`` }>")()).toBe("`}>`");
    expect(await Nostache(`<{ yield "a}>a" }>`)()).toBe("a}>a");
    expect(await Nostache(`<{ yield 'a}>a' }>`)()).toBe("a}>a");
    expect(await Nostache("<{ yield `a}>a` }>")()).toBe("a}>a");
    expect(await Nostache(`<{ yield " }> " }>`)()).toBe(" }> ");
    expect(await Nostache(`<{ yield ' }> ' }>`)()).toBe(" }> ");
    expect(await Nostache("<{ yield ` }> ` }>")()).toBe(" }> ");
    expect(await Nostache(`<{ yield (() => "a}>a")() }>`)()).toBe("a}>a");
    expect(await Nostache(`<{ yield (() => 'a}>a')() }>`)()).toBe("a}>a");
    expect(await Nostache("<{ yield (() => `a}>a`)() }>")()).toBe("a}>a");
    expect(await Nostache(`<{ let a = "}>"; if (true) { <a>{= a =}</a> } a = "<{";}><a>{= a =}</a>`)()).toBe("<a>}&#62;</a><a>&#60;{</a>");
    expect(await Nostache(`<{ let a = "<{"; if (true) { <a>{= a =}</a> } a = "}>";}><a>{= a =}</a>`)()).toBe("<a>&#60;{</a><a>}&#62;</a>");
    expect(await Nostache(`<{ let a = "{="; if (true) { <a>{= a =}</a> } a = "=}";}><a>{= a =}</a>`)()).toBe("<a>{=</a><a>=}</a>");
    expect(await Nostache(`<{ let a = "{~"; if (true) { <a>{= a =}</a> } a = "~}";}><a>{= a =}</a>`)()).toBe("<a>{~</a><a>~}</a>");
    expect(await Nostache(`<{ const a = {"a": "aa"}; {<div>"{= a.a =}"</div>} }>`)()).toBe("<div>\"aa\"</div>");
    expect(await Nostache(`<{ const a = {"a": "aa"}; {<div class="{= a.a =}"></div>} }>`)()).toBe("<div class=\"aa\"></div>");
});

test("Comments in output blocks", async () => {
    expect(await Nostache(`{= //=}
    1 =}`)()).toBe("1");
    expect(await Nostache(`{= //=}abc=}
    1 =}`)()).toBe("1");
    expect(await Nostache(`{= /*=}*/1 =}`)()).toBe("1");
    expect(await Nostache(`{= /*=}abc=}*/1 =}`)()).toBe("1");
    expect(await Nostache(`{= // =} 
    1 =}`)()).toBe("1");
    expect(await Nostache(`{= //=} abc =} 
    1 =}`)()).toBe("1");
    expect(await Nostache(`{= /* =} */ 1 =}`)()).toBe("1");
    expect(await Nostache(`{= /* =} abc =} */ 1 =}`)()).toBe("1");
    expect(await Nostache(`{= 1 //=}
    =}`)()).toBe("1");
    expect(await Nostache(`{= 1 //=}abc=}
    =}`)()).toBe("1");
    expect(await Nostache(`{= 1/*=}*/ =}`)()).toBe("1");
    expect(await Nostache(`{= 1/*=}abc=}*/ =}`)()).toBe("1");
    expect(await Nostache(`{= 1// =} 
    =}`)()).toBe("1");
    expect(await Nostache(`{= 1// =} abc =} 
    =}`)()).toBe("1");
    expect(await Nostache(`{= 1 /* =} */ =}`)()).toBe("1");
    expect(await Nostache(`{= 1 /* =} abc =} */ =}`)()).toBe("1");
    expect(await Nostache(`{= 1 //=}
    +2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1 //abc=}def
    +2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1/*=}*/+2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1/*abc=}def*/+2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1// =} 
    + 2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1// abc =} def
    + 2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1 /* =} */ + 2 =}`)()).toBe("3");
    expect(await Nostache(`{= 1 /* abc =} def */ + 2 =}`)()).toBe("3");
    expect(await Nostache(`{~ //~}
    1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ //~}abc~}
    1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ /*~}*/1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ /*~}abc~}*/1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ // ~} 
    1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ //~} abc ~} 
    1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ /* ~} */ 1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ /*~} abc ~} */ 1 ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1 //~}
    ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1 //~}abc~}
    ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1/*~}*/ ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1/*~}abc~}*/ ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1// ~} 
    ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1// ~} abc ~} 
    ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1 /* ~} */ ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1 /* ~} abc ~} */ ~}`)()).toBe("1");
    expect(await Nostache(`{~ 1 //~}
    +2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1 //abc~}def
    +2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1/*~}*/+2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1/*abc~}def*/+2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1// ~} 
    + 2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1// abc ~} def
    + 2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1 /* ~} */ + 2 ~}`)()).toBe("3");
    expect(await Nostache(`{~ 1 /* abc ~} def */ + 2 ~}`)()).toBe("3");
});

test("Comments in logic blocks", async () => {
    expect(await Nostache(`<{ //}>
    yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ //}>abc}>
    yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ /*}>*/yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ /*}>abc}>*/yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ // }> 
    yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ //}> abc }> 
    yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ /* }> */ yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ /*}> abc }> */ yield 1 }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1 //}>
    }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1 //}>abc}>
    }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1/*}>*/ }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1/*}>abc}>*/ }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1// }> 
    }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1// }> abc }> 
    }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1 /* }> */ }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1 /* }> abc }> */ }>`)()).toBe("1");
    expect(await Nostache(`<{ yield 1 //}>
    +2 }>`)()).toBe("3");
    expect(await Nostache(`<{ yield 1 //abc}>def
    +2 }>`)()).toBe("3");
    expect(await Nostache(`<{ yield 1/*}>*/+2 }>`)()).toBe("3");
    expect(await Nostache(`<{ yield 1/*abc}>def*/+2 }>`)()).toBe("3");
});

test("Comments in html and text blocks", async () => {
    expect(await Nostache(`<ul><{ { /* comment <{{={~{<{>{@ */ <li>{= this[0] =}</li> /* comment <{{={~{<{>{@ */} }></ul>`)(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache(`<ul><{ { /* comment <{{={~{<{>{@ <li>{= this[0] =}</li>*/ /* comment <{{={~{<{>{@ */} }></ul>`)(1)).toBe("<ul></ul>");
    expect(await Nostache(`<ul><{ { // comment <{{={~{<{>{@
    <li>{= this[0] =}</li>
    // comment <{{={~{<{>{@
    } }></ul>`)(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache(`<ul><{ { // comment <{{={~{<{>{@ <li>{= this[0] =}</li>
    // comment <{{={~{<{>{@
    } }></ul>`)(1)).toBe("<ul></ul>");
    expect(await Nostache(`<div><{ {> /* comment */ text {= this[0] =} /* comment 1 */ <} }></div>`)(1)).toBe("<div> /* comment */ text 1 /* comment 1 */ </div>");
    expect(await Nostache(`<div><{ {> // comment
    text {= this[0] =}
    // comment 1
    <} }></div>`)(1)).toBe(`<div> // comment
    text 1
    // comment 1
    </div>`);
    expect(await Nostache(`<div><{ {> // comment text {= this[0] =}
    // comment 1
    <} }></div>`)(1)).toBe(`<div> // comment text 1
    // comment 1
    </div>`);
});

test("Comments in declaration blocks", async () => {
    expect(await Nostache(`{@ /* comment <{{={~{<{>{@ */ a/* comment <{{={~{<{>{@ */, /* comment <{{={~{<{>{@ */ b /* comment <{{={~{<{>{@ */@}{= a =}{= b =}`)(1, 2)).toBe("12");
    expect(await Nostache(`{@// comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    ,// comment <{{={~{<{>{@ */
    b // comment <{{={~{<{>{@ */
    @}{= a =}{= b =}`)(1, 2)).toBe("12");
    expect(await Nostache(`<div><{ {@/* comment <{{={~{<{>{@ */ a/* comment <{{={~{<{>{@ */, /* comment <{{={~{<{>{@ */ b /* comment <{{={~{<{>{@ */ @}{= a =}{= b =} }></div>`)(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ {@ // comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    ,// comment <{{={~{<{>{@ */
    b // comment <{{={~{<{>{@ */
    @}{= a =}{= b =} }></div>`)(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`{@ /* comment <{{={~{<{>{@ */ a /* comment <{{={~{<{>{@ */ 'partials/12.htm' /* comment <{{={~{<{>{@ */ @}{= a(...this) =}`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("12");
    expect(await Nostache(`{@ // comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    'partials/12.htm'
    // comment <{{={~{<{>{@ */
    @}{= a(...this) =}`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("12");
    expect(await Nostache(`<div><{ {@ /* comment <{{={~{<{>{@ */ a /* comment <{{={~{<{>{@ */ 'partials/12.htm' /* comment <{{={~{<{>{@ */ @}{= a(...this) =} }></div>`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ {@ // comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    'partials/12.htm'
    // comment <{{={~{<{>{@ */
    @}{= a(...this) =} }></div>`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ const a = {@ /* comment <{{={~{<{>{@ */ 'partials/12.htm' /* comment <{{={~{<{>{@ */ @}{= a(...this) =} }></div>`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ const a = {@ // comment <{{={~{<{>{@ */
    'partials/12.htm'
    // comment <{{={~{<{>{@ */
    @}{= a(...this) =} }></div>`, {
        import: p => p === 'partials/12.htm' ? "{@a,b@}{=a=}{=b=}" : "",
    })(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`{@ /* comment <{{={~{<{>{@ */ a /* comment <{{={~{<{>{@ */ (/*0*/a /*1*/, /*2*/b/*3*/) {=a=}{=b=} @}{= a(...this) =}`)(1, 2)).toBe("12");
    expect(await Nostache(`{@ // comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    (//0*/
    a //1*/
    , //2*/
    b//3*/
    ) {=a=}{=b=}
    @}{= a(...this) =}`)(1, 2)).toBe("12");
    expect(await Nostache(`<div><{ {@ /* comment <{{={~{<{>{@ */ a /* comment <{{={~{<{>{@ */ (/*0*/a /*1*/, /*2*/b/*3*/) {=a=}{=b=} @}{= a(...this) =} }></div>`)(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ {@ // comment <{{={~{<{>{@ */
    a // comment <{{={~{<{>{@ */
    (//0*/
    a //1*/
    , //2*/
    b//3*/
    ) {=a=}{=b=}
    @}{= a(...this) =} }></div>`)(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ let a = {@ /* comment <{{={~{<{>{@ */ (/*0*/a /*1*/, /*2*/b/*3*/) {=a=}{=b=} @}{= a(...this) =} }></div>`)(1, 2)).toBe("<div>12</div>");
    expect(await Nostache(`<div><{ let a = {@ // comment <{{={~{<{>{@ */
    (//0*/
    a //1*/
    , //2*/
    b//3*/
    ) {=a=}{=b=}
    @}{= a(...this) =} }></div>`)(1, 2)).toBe("<div>12</div>");
});

test("Output in logic blocks", async () => {
    expect(await Nostache(`<{{=10=}}>`)()).toBe("10");
    expect(await Nostache(`<{{="<>&'\\""=}}>`)()).toBe("&#60;&#62;&#38;&#39;&#34;");
    expect(await Nostache(`<{ {= 10 =} }>`)()).toBe("10");
    expect(await Nostache(`<{ {= "<>&'\\"" =} }>`)()).toBe("&#60;&#62;&#38;&#39;&#34;");
    expect(await Nostache(`<p><{ const a = 10; {<a>{=a=}</a>} }></p>`)()).toBe("<p><a>10</a></p>");
    expect(await Nostache(`<{{~"<>&'\\""~}}>`)()).toBe("<>&'\"");
    expect(await Nostache(`<{ {~ 10 ~} }>`)()).toBe("10");
    expect(await Nostache(`<p><{ const a = 10; {<a>{~a~}</a>} }></p>`)()).toBe("<p><a>10</a></p>");
});

test("This argument", async () => {
    expect(await Nostache("{= this[0] =}")(10)).toBe("10");
    expect(await Nostache("{= this[0] =}")(true)).toBe("true");
    expect(await Nostache("{= this[0] =}")("")).toBe("");
    expect(await Nostache("{= this[0].a =}")({a: 'aa'})).toBe("aa");
    expect(await Nostache("<p>{= this[0] =}</p>")(10)).toBe("<p>10</p>");
    expect(await Nostache("<p>{= this[0] =}</p>")(true)).toBe("<p>true</p>");
    expect(await Nostache("<p>{= this[0] =}</p>")("")).toBe("<p></p>");
    expect(await Nostache("<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("<p>aa</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p>} }>")(10)).toBe("<p>10</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p>} }>")(true)).toBe("<p>true</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p>} }>")("")).toBe("<p></p>");
    expect(await Nostache("<{if (true) {<p>{= this[0].a =}</p>} }>")({a: 'aa'})).toBe("<p>aa</p>");
});

test("Multiple arguments", async () => {
    expect(await Nostache("{= this[0] =}{= this[1] =}")(10, 11)).toBe("1011");
    expect(await Nostache("{= this[0] =}{= this[1] =}")(true, false)).toBe("truefalse");
    expect(await Nostache("{= this[0] =}{= this[1] =}")("", "")).toBe("");
    expect(await Nostache("{= this[0].a =}{= this[1].b =}")({a: 'aa'}, {b: 'bb'})).toBe("aabb");
    expect(await Nostache("<p>{= this[0] =}</p><p>{= this[1] =}</p>")(10, 11)).toBe("<p>10</p><p>11</p>");
    expect(await Nostache("<p>{= this[0] =}</p><p>{= this[1] =}</p>")(true, false)).toBe("<p>true</p><p>false</p>");
    expect(await Nostache("<p>{= this[0] =}</p><p>{= this[1] =}</p>")("", "")).toBe("<p></p><p></p>");
    expect(await Nostache("<p>{= this[0].a =}</p><p>{= this[1].b =}</p>")({a: 'aa'}, {b: 'bb'})).toBe("<p>aa</p><p>bb</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p><p>{= this[1] =}</p>} }>")(10, 11)).toBe("<p>10</p><p>11</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p><p>{= this[1] =}</p>} }>")(true, false)).toBe("<p>true</p><p>false</p>");
    expect(await Nostache("<{if (true) {<p>{= this[0] =}</p><p>{= this[1] =}</p>} }>")("", "")).toBe("<p></p><p></p>");
    expect(await Nostache("<{if (true) {<p>{= this[0].a =}</p><p>{= this[1].b =}</p>} }>")({a: 'aa'}, {b: 'bb'})).toBe("<p>aa</p><p>bb</p>");
    expect(await Nostache("<{ const [a,b] = this; }><{if (true) {<p>{= a =}</p><p>{= b =}</p>} }>")('aa', 'bb')).toBe("<p>aa</p><p>bb</p>");
});

test("Arguments iteration", async () => {
    expect(await Nostache("<{for (const p of this){= p =}}>")(10, 11)).toBe("1011");
    expect(await Nostache("<{for (const p of this){= p =}}>")(true, false)).toBe("truefalse");
    expect(await Nostache("<{for (const p of this){= p =}}>")("", "")).toBe("");
    expect(await Nostache("<{for (const p of this){= p.x =}}>")({x: 10}, {x: 11})).toBe("1011");
    expect(await Nostache("<{const [a,b] = this; {=a=} {=b=}}>")(10, 11)).toBe("1011");
    expect(await Nostache("<{const [a,b] = this; {=a=} {=b=}}>")(true, false)).toBe("truefalse");
    expect(await Nostache("<{const [a,b] = this; {=a=} {=b=}}>")("", "")).toBe("");
    expect(await Nostache("<{const [a,b] = this; {=a.x=} {=b.x=}}>")({x: 10}, {x: 11})).toBe("1011");
    expect(await Nostache("<{const [{x:a},{x:b}] = this; {=a=} {=b=}}>")({x: 10}, {x: 11})).toBe("1011");
});

test("Arguments", async () => {
    expect(await Nostache("<{const [{a}] = this;}>{= a =}")({a: 'bb'})).toBe("bb");
    expect(await Nostache("<{const [{A}] = this;}>{= A =}")({A: 'bb'})).toBe("bb");
    expect(await Nostache("<{const [{_a}] = this;}>{= _a =}")({_a: 'bb'})).toBe("bb");
    expect(await Nostache("<{const [{a}] = this;}><p>{= a =}</p>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{A}] = this;}><p>{= A =}</p>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{_a}] = this;}><p>{= _a =}</p>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{a}] = this;}><{if (true) {<p>{= a =}</p>} }>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{A}] = this;}><{if (true) {<p>{= A =}</p>} }>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{_a}] = this;}><{if (true) {<p>{= _a =}</p>} }>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{a,b}] = this;}><{if (a) {<p>{= b =}</p>} }>")({a: true, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{a,b}] = this;}><{if (!a) {<p>{= b =}</p>} }>")({a: false, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{const [{a,b}] = this;}><{if (!a) {<p>{= b =}</p>} }>")({a: true, b: 'bb'})).toBe("");
    expect(await Nostache("<{const [{a,b}] = this;}><{if (a) {<p>{= b =}</p>} }>")({a: false, b: 'bb'})).toBe("");
    expect(await Nostache("<{const [{a,b}] = this;}>{=a=} {=b=}")({a: 'aa', b: 'bb'})).toBe("aa bb");
    expect(await Nostache("<{const [{a,b,c}] = this;}>{=a=} {=b.c=}")({a: 'aa', b: {c: 'bb'}})).toBe("aa bb");
    await (expect(Nostache("<{const [{a,b}] = this;}>{= c =}")({a: 'aa', b: 'bb'}))).rejects.toBeInstanceOf(ReferenceError);
    expect(await Nostache("<{const [{a,b}] = this;}>{=a=} {=b=}")(Object.create({a: 'aa', b: 'bb'}))).toBe("aa bb");
});

test("Arguments mutation", async () => {
    expect(await Nostache("<{let [{a}] = this;}>{= a++ =}<p>{= a =}</p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++a =}<p>{= a =}</p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= a = 'bb' =}<p>{= a =}</p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= a =}<{ a = 'bb' }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a++ =}<p>{= this[0].a =}</p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++this[0].a =}<p>{= this[0].a =}</p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("{= this[0].a = 'bb' =}<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("{= this[0].a =}<{ this[0].a = 'bb'; }><p>{= this[0].a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a++ =}<p>{= a =}</p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++this[0].a =}<p>{= a =}</p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a = 'bb' =}<p>{= a =}</p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a =}<{ this[0].a = 'bb' }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>aa</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= a++ =}<p>{= this[0].a =}</p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++a =}<p>{= this[0].a =}</p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= a = 'bb' =}<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= a =}<{ a = 'bb'; }><p>{= this[0].a =}</p>")({a: 'aa'})).toBe("aa<p>aa</p>");
});

test("Promises", async () => {
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 10))=}")()).toBe("1");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 10))=} {=new Promise(r => setTimeout(() => r(2), 20))=}")()).toBe("1 2");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 20))=} {=new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 20))=} {=new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    await expect(Nostache("{=await new Promise(r => setTimeout(() => r(1), 10))=}")()).rejects.toBeInstanceOf(SyntaxError);
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 10))=}", {async: true})()).toBe("1");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 10))=} {=await new Promise(r => setTimeout(() => r(2), 20))=}", {async: true})()).toBe("1 2");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 20))=} {=await new Promise(r => setTimeout(() => r(2), 10))=}", {async: true})()).toBe("1 2");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 20))=} {=await new Promise(r => setTimeout(() => r(2), 10))=}", {async: true})()).toBe("1 2");
    expect(await Nostache("<{let a = 1;}>{=new Promise(r => setTimeout(() => r(a), 10))=}<{a++;}> {=new Promise(r => setTimeout(() => r(a), 10))=}")()).toBe("1 2");
    expect(await Nostache("<{let a = 1;}>{=await new Promise(r => setTimeout(() => r(a), 10))=}<{a++;}> {=await new Promise(r => setTimeout(() => r(a), 10))=}", {async: true})()).toBe("1 2");
    expect(await Nostache("<{let a = 1; const p = new Promise(r => setTimeout(() => r(a), 10));}>{=p=}<{a++;}> {=p=}")()).toBe("1 1");

    expect(await Nostache(new Promise(r => setTimeout(() => r("{= 1 =}"), 10)))()).toBe("1");
    expect(await Nostache(new Promise(r => setTimeout(() => r("{= this[0] =} {= this[1] =}"), 10)))(1, 2)).toBe("1 2");
});

test("Recursive templates", async () => {
    expect(await Nostache("<li>{= this[0] =}</li><{if (this[0] < 13) }>{~ this(this[0] + 1) ~}")(10)).toBe("<li>10</li><li>11</li><li>12</li><li>13</li>");
    expect(await Nostache("<{let [{a}] = this;}><li>{= a =}</li><{if (a < 13) }>{~ this({a:++a}) ~}")({a: 10})).toBe("<li>10</li><li>11</li><li>12</li><li>13</li>");
});

test("Template reuse", async () => {
    const t = Nostache("<a>{= this[0] =}</a>{= this[1] ?? '' =}");
    expect(await t(10)).toBe("<a>10</a>");
    expect(await t("aa")).toBe("<a>aa</a>");
    expect(await t(true)).toBe("<a>true</a>");
    expect(await t(false)).toBe("<a>false</a>");
    expect(await t(10, 20)).toBe("<a>10</a>20");
});

test("Parameters declaration", async () => {
    expect(await Nostache("{@ a, b @}  {= a =}{= b =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ z, x @}  {= z =}{= x =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ A, B @}  {= A =}{= B =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ Z, X @}  {= Z =}{= X =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ _, _0 @}  {= _ =}{= _0 =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ _, _9 @}  {= _ =}{= _9 =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ _0, _ @}  {= _0 =}{= _ =}")(10, 11)).toBe("1011");
    expect(await Nostache("{@ _9, _ @}  {= _9 =}{= _ =}")(10, 11)).toBe("1011");
    await (expect(Nostache("{@ 0, _ @}  {= 0 =}{= _ =}")(10, 11))).rejects.toBeInstanceOf(ReferenceError);
    expect(await Nostache("<{ {@ a, b @} let c = 12 }>{= a =}{= b =}{= c =}")(10, 11)).toBe("101112");
    expect(await Nostache("<{ let c = 12; {@ a, b @} }>{= a =}{= b =}{= c =}")(10, 11)).toBe("101112");
    expect(await Nostache("<{ let c = 12; {@ a, b @} let d = 13; }>{= a =}{= b =}{= c =}{= d =}")(10, 11)).toBe("10111213");
    expect(await Nostache("{@ {a, b} @}  {= a =}{= b =}")({a: 10, b: 11})).toBe("1011");
    expect(await Nostache("{@ {a:{a}}, [{b}] @}  {= a =}{= b =}")({a: {a: 10}}, [{b: 11}])).toBe("1011");
    expect(await Nostache("{@ [a, b] @}  {= a =}{= b =}")([10, 11])).toBe("1011");
    expect(await Nostache("{@ [{a}, [b]] @}  {= a =}{= b =}")([{a: 10}, [11]])).toBe("1011");
    expect(await Nostache("{@ a, b, ...c @}  {= a =}{= b =}{= c.join('') =}")(10, 11, 12, 13)).toBe("10111213");
    expect(await Nostache("{@ ,b, c = 12 @}  {= b =}{= c =}")(10, 11)).toBe("1112");
});

test("Import declaration", async () => {
    Nostache.options.import = v => v === 'partials/li.htm' ? "<li>{~ this[0] + 1 ~}</li>" : "";
    expect(await Nostache("<ul>{@ li '' @}<{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul></ul>");
    expect(await Nostache("<ul>{@ li 'null' @}<{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul></ul>");

    expect(await Nostache("<ul>{@ a 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ a(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ z 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ A 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ A(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ Z 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ Z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _ 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ _(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _0 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ _0(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _9 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ _9(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    await (expect(Nostache("<ul>{@ 0 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ 0(i) ~} }></ul>")(1))).rejects.toBeInstanceOf(SyntaxError);

    expect(await Nostache("<ul>{@ a new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ a(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ z new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ A new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ A(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ Z new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ Z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _ new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ _(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _0 new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ _0(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _9 new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ _9(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    await (expect(Nostache("<ul>{@ 0 new Promise(r => r('partials/li.htm')) @}<{for (let i = 0; i < this[0]; i++) {~ 0(i) ~} }></ul>")(1))).rejects.toBeInstanceOf(SyntaxError);

    expect(await Nostache("<ul><{const t = 'partials/li.htm' }>{@ a t @}<{for (let i = 0; i < this[0]; i++) {~ a(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = 'partials/'; }>{@ z t + 'li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = 'partials/', p = 'li.htm' }>{@ A t + p @}<{for (let i = 0; i < this[0]; i++) {~ A(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = () => 'partials/li.htm'; }>{@ Z t() @}<{for (let i = 0; i < this[0]; i++) {~ Z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = () => new Promise(r => r('partials/li.htm')) }>{@ _ t() @}<{for (let i = 0; i < this[0]; i++) {~ _(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = new Promise(r => r('partials/li.htm')); }>{@ _0 t @}<{for (let i = 0; i < this[0]; i++) {~ _0(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = 'partials/li.htm' }>{@ _9 [t][0] @}<{for (let i = 0; i < this[0]; i++) {~ _9(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{const t = 'partials/li.htm'; }>{@ _9 {a: t}.a @}<{for (let i = 0; i < this[0]; i++) {~ _9(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    await (expect(Nostache("<ul><{const t = 'partials/li.htm' }>{@ 0 t @}<{for (let i = 0; i < this[0]; i++) {~ 0(i) ~} }></ul>")(1))).rejects.toBeInstanceOf(SyntaxError);

    expect(await Nostache("<ul>{@ li 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {= li(i) =} }></ul>")(1)).toBe("<ul>&#60;li&#62;1&#60;/li&#62;</ul>");
    expect(await Nostache("<ul>{@ li 'partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul>{@ li "partials/li.htm" @} <{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul>{@ li `partials/li.htm` @}  <{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul>{@ li `partials/${"li"}.htm` @}   <{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ li 'partials/' + 'li.htm' @}    <{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul><{ {@ li 'partials/li.htm' @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{ {@ li "partials/li.htm" @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{ {@ li `partials/li.htm` @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ {@ li `partials/${"li"}.htm` @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("<ul><{ {@ li 'partials/' + 'li.htm' @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{ for (let i = 0; i < this[0]; i++) { {@ li 'partials/li.htm' @} {~ li(i) ~}} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { {@ li "partials/li.htm" @} {~ li(i) ~}} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { {@ li `partials/li.htm` @} {~ li(i) ~}} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { {@ li `partials/${"li"}.htm` @} {~ li(i) ~}} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul><{ for (let i = 0; i < this[0]; i++) { {@ li 'partials/' + 'li.htm' @} {~ li(i) ~}} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");

    expect(await Nostache("<ul><{ let li = {@ 'partials/li.htm' @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{ let li = {@ "partials/li.htm" @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{ let li = {@ `partials/li.htm` @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ let li = {@ `partials/${"li"}.htm` @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("<ul><{ let li = {@ 'partials/' + 'li.htm' @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{ for (let i = 0; i < this[0]; i++) { let li = {@ 'partials/li.htm' @} {~ li(i) ~}} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { let li = {@ "partials/li.htm" @} {~ li(i) ~}} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { let li = {@ `partials/li.htm` @} {~ li(i) ~}} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{ for (let i = 0; i < this[0]; i++) { let li = {@ `partials/${"li"}.htm` @} {~ li(i) ~}} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul><{ for (let i = 0; i < this[0]; i++) { let li = {@ 'partials/' + 'li.htm' @} {~ li(i) ~}} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");

    expect(await Nostache("{@ n @}<ul>{@ li 'partials/li.htm' @}<{for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul>{@ n @} {@ li "partials/li.htm" @}<{for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul>{@ li `partials/li.htm` @} {@ n @} <{for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul>{@ li `partials/${"li"}.htm` @}<{ {@ n @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("{@ n @} <ul>{@ li 'partials/' + 'li.htm' @}<{for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul>{@ n @} <{ {@ li 'partials/li.htm' @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{ {@ li "partials/li.htm" @} {@ n @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('{@ n @} <ul><{ {@ li `partials/li.htm` @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul>{@ n @} <{ {@ li `partials/${"li"}.htm` @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("<ul><{ {@ n @} {@ li 'partials/' + 'li.htm' @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("{@ n @}<ul><{ for (let i = 0; i < n; i++) { {@ li 'partials/li.htm' @} {~ li(i) ~}} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul> {@ n @} <{ for (let i = 0; i < n; i++) { {@ li "partials/li.htm" @} {~ li(i) ~}} }> </ul>')(3)).toBe("<ul> <li>1</li><li>2</li><li>3</li> </ul>");
    expect(await Nostache('<ul><{ {@ n @} for (let i = 0; i < n; i++) { {@ li `partials/li.htm` @} {~ li(i) ~}} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('{@ n @}<ul><{ for (let i = 0; i < n; i++) { {@ li `partials/${"li"}.htm` @} {~ li(i) ~}} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul>{@ n @} <{ for (let i = 0; i < n; i++) { {@ li 'partials/' + 'li.htm' @} {~ li(i) ~}} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");

    expect(await Nostache("{@ n @}<ul><{ let li = {@ 'partials/li.htm' @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul>{@ n @} <{ let li = {@ "partials/li.htm" @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{ {@ n @} let li = {@ `partials/li.htm` @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ let li = {@ `partials/${"li"}.htm` @} {@ n @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("{@ n @}<ul><{ let li = {@ 'partials/' + 'li.htm' @} for (let i = 0; i < n; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ n @} <{ for (let i = 0; i < n; i++) { let li = {@ 'partials/li.htm' @} {~ li(i) ~}} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{ {@ n @} for (let i = 0; i < n; i++) { let li = {@ "partials/li.htm" @} {~ li(i) ~}} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('{@ n @}<ul><{ for (let i = 0; i < n; i++) { let li = {@ `partials/li.htm` @} {~ li(i) ~}} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul> {@ n @} <{ for (let i = 0; i < n; i++) { let li = {@ `partials/${"li"}.htm` @} {~ li(i) ~}} }> </ul>')(2)).toBe("<ul> <li>1</li><li>2</li> </ul>");
    expect(await Nostache("{@ n @} <ul><{ for (let i = 0; i < n; i++) { let li = {@ 'partials/' + 'li.htm' @} {~ li(i) ~}} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");

    expect(await Nostache("<ul><{for (let i = 0; i < this[0]; i++) {let li = {@ 'partials/li.htm' @}(i); {~ li ~}} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache('<ul><{for (let i = 0; i < this[0]; i++) {const li = {@ "partials/li.htm" @}(i); {~ li ~}} }></ul>')(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache('<ul><{for (let i = 0; i < this[0]; i++) {let li = {@ `partials/li.htm` @}(i); {~ li ~}} }></ul>')(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache('<ul><{for (let i = 0; i < this[0]; i++) {const li = {@ `partials/${"li"}.htm` @}(i); {~ li ~}} }></ul>')(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{for (let i = 0; i < this[0]; i++) {let li = {@ 'partials/' + 'li.htm' @}(i); {~ li ~}} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");

    delete Nostache.options.import;
});

test("Template declaration", async () => {
    expect(await Nostache("<ul>{@ a (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ a(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ z (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ A (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ A(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ Z (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ Z(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _ (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ _(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _0 (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ _0(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ _9 (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ _9(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    await (expect(Nostache("<ul>{@ 0 (i) <li>{= i + 1 =}</li> @}<{for (let i = 0; i < this[0]; i++) {~ 0(i) ~} }></ul>")(1))).rejects.toBeInstanceOf(SyntaxError);
    expect(await Nostache(`<ul>{@
        a
        
        (i)
        
        <li>{= i + 1 =}</li>
        
        @}<{for (let i = 0; i < this[0]; i++) {~ a(i) ~} }></ul>`)(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("{@ li (i) <li>{= i + 1 =}</li> @} <ul><{for (let i = 0; i < this[0]; i++) {= li(i) =} }></ul>")(1)).toBe("<ul>&#60;li&#62;1&#60;/li&#62;</ul>");
    expect(await Nostache("{@ li (i) <li>{= i + 1 =}</li> @} <ul><{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul>{@ li (i) <li>{= i + 1 =}</li> @} <{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul><{ {@ li (i) <li>{= i + 1 =}</li> @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("<{ let li = {@ (i) <li>{= i + 1 =}</li> @} }><ul><{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul><li>1</li></ul>");
    expect(await Nostache("<ul><{ let li = {@ (i) <li>{= i + 1 =}</li> @} }><{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    expect(await Nostache("<ul><{ let li = {@ (i) <li>{= i + 1 =}</li> @} for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(3)).toBe("<ul><li>1</li><li>2</li><li>3</li></ul>");
    expect(await Nostache("{@ b(t) <b>{=t=}</b> @} {@ i(t) <i>{=t=}</i> @} <p>{~ b(this[0]) ~}{~ i(this[1]) ~}</p>")(1, 2)).toBe("<p><b>1</b><i>2</i></p>");
    expect(await Nostache("{@ b(t) <b>{=t=}</b> @} <p>{@ i(t) <i>{=t=}</i> @}{~ b(this[0]) ~}{~ i(this[1]) ~}</p>")(1, 2)).toBe("<p><b>1</b><i>2</i></p>");
    expect(await Nostache("<p>{@ b(t) <b>{=t=}</b> @}{~ b(this[0]) ~}{@ i(t) <i>{=t=}</i> @}{~ i(this[1]) ~}</p>")(1, 2)).toBe("<p><b>1</b><i>2</i></p>");
    expect(await Nostache("{@ tr (i) {@ td (i,j) <td>{=i=}{=j=}</td> @} <tr>{~td(i,1)~}{~td(i,2)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(1))
        .toBe("<table><tr><td>11</td><td>12</td></tr></table>");
    expect(await Nostache("{@ tr (i) <tr>{@ td (i,j) <td>{=i=}{=j=}</td> @} {~td(i,1)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table>{@ tr (i) <tr>{@ td (i,j) <td>{=i=}{=j=}</td> @} {~td(i,1)~}</tr> @} <{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table><{ {@ tr (i) <tr>{@ td (i,j) <td>{=i=}{=j=}</td> @} {~td(i,1)~}</tr> @} for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("{@ biu() {@ t,p,q @} <b>{=t=}</b><i>{= p =}</i><u>{= q =}</u> @} <p>{~ biu() ~}</p>")(1, 2, 3)).toBe("<p><b>1</b><i>2</i><u>3</u></p>");
    expect(await Nostache("{@ biu(t) <b>{=t=}</b>{@ ,p,q @} <i>{= p =}</i><u>{= q =}</u> @} <p>{~ biu(this[0]) ~}</p>")(1, 2, 3)).toBe("<p><b>1</b><i>2</i><u>3</u></p>");

    Nostache.options.import = v => v === 'partials/td.htm' ? "{@ i, j @}<td>{= i =}{= j =}</td>" : "";
    expect(await Nostache("{@ tr (i) {@ td 'partials/td.htm' @} <tr>{~td(i,1)~}{~td(i,2)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(1))
        .toBe("<table><tr><td>11</td><td>12</td></tr></table>");
    expect(await Nostache("{@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table>{@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} <{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table><{ {@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    delete Nostache.options.import;
});

test("Node Import", async () => {
    const fs = require('fs/promises');
    const path = 'test/partials/li.htm';
    const file = await fs.readFile(path, 'utf8');
    expect(Nostache.cache.get(path, "import")).toBeUndefined();
    expect(await Nostache(`<ul>{~ this.import('test/partials/li.htm')(1) ~}</ul>`)(1)).toBe("<ul><li>1</li></ul>");
    expect(Nostache.cache.get(path, "import")).toBe(file);
    Nostache.cache.clear();
    expect(await Nostache(`<ul>{@ li 'test/partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ li(i + 1) ~} }></ul>`)(1)).toBe("<ul><li>1</li></ul>");
    expect(Nostache.cache.get(path, "import")).toBe(file);
    await fs.rename(path, path + "_");
    expect(await Nostache(`<ul>{@ li 'test/partials/li.htm' @}<{for (let i = 0; i < this[0]; i++) {~ li(i + 1) ~} }></ul>`)(2)).toBe("<ul><li>1</li><li>2</li></ul>");
    await fs.rename(path + "_", path);
    Nostache.cache.clear();
    const err = 'test/partials/err.htm';
    expect(Nostache.cache.get(err, "import")).toBeUndefined();
    await expect(Nostache(`<ul>{~ this.import('test/partials/err.htm')() ~}</ul>`)()).rejects.toThrow('ENOENT');
    await expect(Nostache(`<ul>{@ li 'test/partials/err.htm' @}<{for (let i = 0; i < this[0]; i++) {~ li(i + 1) ~} }></ul>`)(2)).rejects.toThrow('ENOENT');
    expect(await Nostache(`<ul>{@ li 'test/partials/err.htm' @}<{for (let i = 0; i < this[0]; i++) {~ li(i + 1) ~} }></ul>`)(0)).toBe("<ul></ul>");
    expect(Nostache.cache.get(path, "import")).toBeUndefined();
});

test("To string", async () => {
    const template = Nostache("<a>{= 10 =}</a>");
    const re = /^function[^<]+<a>[^1]+10[^<]+<\/a>/i;
    expect(template.toString()).not.toMatch(re);
    await template();
    expect(template.toString()).toMatch(re);
});

test("Data type conversion", async () => {
    Nostache.options.cache = "function";
    expect(await Nostache("<a>{~ this.import(0)() ~}{~ this.escape(0) ~}</a>", {
        import: a => a === '0' ? 'a' : '',
        escape: b => b === 0 ? 'b' : '',
    })()).toBe("<a>ab</a>");
    expect(await Nostache("<a>{~ this.import(1)() ~}{~ this.escape(1) ~}</a>", {
        import: a => a === '1' ? 'a' : '',
        escape: b => b === 1 ? 'b' : '',
    })()).toBe("<a>ab</a>");
    expect(await Nostache("<a>{~ this.import('')() ~}{~ this.escape('') ~}</a>", {
        import: a => a === '' ? 'a' : '',
        escape: b => b === '' ? 'b' : '',
    })()).toBe("<a>ab</a>");
    expect(await Nostache("<a>{~ this.import(true)() ~}{~ this.escape(true) ~}</a>", {
        import: a => a === 'true' ? 'a' : '',
        escape: b => b === true ? 'b' : '',
    })()).toBe("<a>ab</a>");
    expect(await Nostache("<a>{~ this.import(undefined)() ~}{~ this.escape(undefined) ~}</a>", {
        import: a => a === 'undefined' ? 'a' : '',
        escape: b => b === undefined ? 'b' : '',
    })()).toBe("<a>ab</a>");
    expect(await Nostache("<a>{~ this.import(null)() ~}{~ this.escape(null) ~}</a>", {
        import: a => a === 'null' ? 'a' : '',
        escape: b => b === null ? 'b' : '',
    })()).toBe("<a>ab</a>");

    delete Nostache.options.import;
    delete Nostache.options.escape;
    delete Nostache.options.cache;
    Nostache.cache.clear();
});

test("Explicit options", async () => {
    Nostache.options.cache = "function";
    const template = "<a>{~ this.import('a')() ~}{~ this.escape('b') ~}</a>";
    expect(await Nostache(template, {
        import: a => a === 'a' ? '1' : '',
        escape: b => b === 'b' ? '2' : '',
    })()).toBe("<a>12</a>");
    expect(await Nostache(template, {
        import: a => new Promise(r => r(a === 'a' ? '3' : '')),
        escape: b => new Promise(r => r(b === 'b' ? '4' : '')),
    })()).toBe("<a>34</a>");
    expect(await Nostache(template, {
        import: a => a === 'a' ? '5' : '',
        escape: b => b === 'b' ? '6' : '',
    })()).toBe("<a>56</a>");
    expect(await Nostache(template, {
        import: a => new Promise(r => r(a === 'a' ? '7' : '')),
        escape: b => new Promise(r => r(b === 'b' ? '8' : '')),
    })()).toBe("<a>78</a>");

    Nostache.options.import = a => a === 'a' ? '1' : '';
    Nostache.options.escape = b => b === 'b' ? '2' : '';
    expect(await Nostache(template)()).toBe("<a>12</a>");

    Nostache.options.import = a => new Promise(r => r(a === 'a' ? '3' : ''));
    Nostache.options.escape = b => new Promise(r => r(b === 'b' ? '4' : ''));
    expect(await Nostache(template, {})()).toBe("<a>34</a>");

    Nostache.options.import = a => a === 'a' ? '5' : '';
    Nostache.options.escape = b => b === 'b' ? '6' : '';
    expect(await Nostache(template)()).toBe("<a>56</a>");

    Nostache.options.import = a => new Promise(r => r(a === 'a' ? '7' : ''));
    Nostache.options.escape = b => new Promise(r => r(b === 'b' ? '8' : ''));
    expect(await Nostache(template, {})()).toBe("<a>78</a>");

    delete Nostache.options.import;
    delete Nostache.options.escape;
    delete Nostache.options.cache;
    Nostache.cache.clear();
});

test("Implicit options", async () => {
    Nostache.options.cache = "function";
    const template = "{@ a 'a' @}<a>{~ a() ~}{= 'b' =}</a>";
    expect(await Nostache(template, {
        import: a => a === 'a' ? '1' : '',
        escape: b => b === 'b' ? '2' : '',
    })()).toBe("<a>12</a>");
    expect(await Nostache(template, {
        import: a => new Promise(r => r(a === 'a' ? '3' : '')),
        escape: b => new Promise(r => r(b === 'b' ? '4' : '')),
    })()).toBe("<a>34</a>");
    expect(await Nostache(template, {
        import: a => a === 'a' ? '5' : '',
        escape: b => b === 'b' ? '6' : '',
    })()).toBe("<a>56</a>");
    expect(await Nostache(template, {
        import: a => new Promise(r => r(a === 'a' ? '7' : '')),
        escape: b => new Promise(r => r(b === 'b' ? '8' : '')),
    })()).toBe("<a>78</a>");

    Nostache.options.import = a => a === 'a' ? '1' : '';
    Nostache.options.escape = b => b === 'b' ? '2' : '';
    expect(await Nostache(template)()).toBe("<a>12</a>");

    Nostache.options.import = a => new Promise(r => r(a === 'a' ? '3' : ''));
    Nostache.options.escape = b => new Promise(r => r(b === 'b' ? '4' : ''));
    expect(await Nostache(template, {})()).toBe("<a>34</a>");

    Nostache.options.import = a => a === 'a' ? '5' : '';
    Nostache.options.escape = b => b === 'b' ? '6' : '';
    expect(await Nostache(template)()).toBe("<a>56</a>");

    Nostache.options.import = a => new Promise(r => r(a === 'a' ? '7' : ''));
    Nostache.options.escape = b => new Promise(r => r(b === 'b' ? '8' : ''));
    expect(await Nostache(template, {})()).toBe("<a>78</a>");

    delete Nostache.options.import;
    delete Nostache.options.escape;
    delete Nostache.options.cache;
    Nostache.cache.clear();
});

test("Nested template options", async () => {
    Nostache.options.cache = "function";
    expect(await Nostache(`{@ li "partials/li.htm" @}<ul>{~ li(1) ~}</ul>`, {
        import: s => s === "partials/li.htm" ? "<li>{= this[0] =}</li>" : "",
        escape: s => s === 1 ? "a" : "",
    })()).toBe("<ul><li>a</li></ul>");
    expect(await Nostache(`{@ li "partials/li.htm" @}<ul>{~ li() ~}</ul>`, {
        import: s => s === "partials/li.htm" ? "<li>{= this.a(1) =}</li>" : "",
        extensions: {a: s => s === 1 ? "a" : ""},
    })()).toBe("<ul><li>a</li></ul>");
    expect(await Nostache(`{@ li "partials/li.htm" @}<ul>{~ li(this[0]) ~}</ul>`, {
        import: s => s === "partials/li.htm" ? `{@ a "partials/a.htm" @}<li>{~ a(this[0]) ~}</li>` : s === "partials/a.htm" ? `<a>{= this[0] =}</a>` : "",
    })(1)).toBe("<ul><li><a>1</a></li></ul>");
    delete Nostache.options.cache;
});

test("Function cache", async () => {
    const t = "<a>{~ 1 ~}{= 2 =}</a>";
    const f1 = Nostache(t);
    const f2 = Nostache(new Promise(r => r(t)));
    const f3 = Nostache(t, {async: true});
    const f4 = Nostache(new Promise(r => r(t)), {async: true});
    const f5 = Nostache(t, {cache: false});
    const f6 = Nostache(new Promise(r => r(t)), {cache: false});
    const f7 = Nostache(t, {async: true, cache: false});
    const f8 = Nostache(new Promise(r => r(t)), {async: true, cache: false});
    expect(Nostache.cache.get(t)).toBeUndefined();
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    await f1();
    expect(Nostache.cache.get(t)).toBeInstanceOf(Function);
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    Nostache.cache.clear();
    await f2();
    expect(Nostache.cache.get(t)).toBeInstanceOf(Function);
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    Nostache.cache.clear();
    await f3();
    expect(Nostache.cache.get(t, "async")).toBeInstanceOf(Function);
    expect(Nostache.cache.get(t)).toBeUndefined();
    Nostache.cache.clear();
    await f4();
    expect(Nostache.cache.get(t, "async")).toBeInstanceOf(Function);
    expect(Nostache.cache.get(t)).toBeUndefined();
    Nostache.cache.clear();
    await f5();
    expect(Nostache.cache.get(t)).toBeUndefined();
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    Nostache.cache.clear();
    await f6();
    expect(Nostache.cache.get(t)).toBeUndefined();
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    Nostache.cache.clear();
    await f7();
    expect(Nostache.cache.get(t)).toBeUndefined();
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
    Nostache.cache.clear();
    await f8();
    expect(Nostache.cache.get(t)).toBeUndefined();
    expect(Nostache.cache.get(t, "async")).toBeUndefined();
});

test("Cache levels", async () => {
    const f1 = () => "";
    const f2 = () => "";
    const f3 = () => "";
    expect(Nostache.cache.get("aa")).toBeUndefined();
    expect(Nostache.cache.get("aa", "import")).toBeUndefined();
    expect(Nostache.cache.get("aa", "async")).toBeUndefined();
    Nostache.cache.set("aa", f1);
    expect(Nostache.cache.get("aa")).toBe(f1);
    expect(Nostache.cache.get("aa", "import")).toBeUndefined();
    expect(Nostache.cache.get("aa", "async")).toBeUndefined();
    Nostache.cache.set("aa", f2, "import");
    expect(Nostache.cache.get("aa")).toBe(f1);
    expect(Nostache.cache.get("aa", "import")).toBe(f2);
    expect(Nostache.cache.get("aa", "async")).toBeUndefined();
    Nostache.cache.set("aa", f3, "async");
    expect(Nostache.cache.get("aa")).toBe(f1);
    expect(Nostache.cache.get("aa", "import")).toBe(f2);
    expect(Nostache.cache.get("aa", "async")).toBe(f3);
    Nostache.cache.delete("aa");
    expect(Nostache.cache.get("aa")).toBeUndefined();
    expect(Nostache.cache.get("aa", "import")).toBe(f2);
    expect(Nostache.cache.get("aa", "async")).toBe(f3);
    Nostache.cache.delete("aa", "import");
    expect(Nostache.cache.get("aa")).toBeUndefined();
    expect(Nostache.cache.get("aa", "import")).toBeUndefined();
    expect(Nostache.cache.get("aa", "async")).toBe(f3);
    Nostache.cache.delete("aa", "async");
    expect(Nostache.cache.get("aa")).toBeUndefined();
    expect(Nostache.cache.get("aa", "import")).toBeUndefined();
    expect(Nostache.cache.get("aa", "async")).toBeUndefined();
    Nostache.cache.set("aa", f1);
    Nostache.cache.set("aa", f1, "import");
    Nostache.cache.set("aa", f1, "async");
    Nostache.cache.clear();
    expect(Nostache.cache.get("aa")).toBeUndefined();
    expect(Nostache.cache.get("aa", "import")).toBeUndefined();
    expect(Nostache.cache.get("aa", "async")).toBeUndefined();
});

test("Extensions", async () => {
    Nostache.options.extensions = {a: 10, b: "bb", f: p => p, o: {p: 3}};
    expect(await Nostache("{= this.a =} {= this.b =} {= this.f(true) =} {= this.o.p =}")()).toBe("10 bb true 3");
    expect(await Nostache("{= this.a =} {= this.b =} {= this.f(true) =} {= this.o.p =}", {extensions: {a: 11, b: "BB", f: () => "FF", o: {p: 4}}})()).toBe("11 BB FF 4");
    delete Nostache.options.extensions;
    await (expect(Nostache("{= this.a =} {= this.b =} {= this.f(true) =}")())).rejects.toBeInstanceOf(TypeError);
    expect(await Nostache("{= this.a =} {= this.b =} {= this.f(true) =} {= this.o.p =}", {extensions: {a: 10, b: "bb", f: p => p, o: {p: 3}}})()).toBe("10 bb true 3");
});

test("Layouts", async () => {
    expect(await Nostache(`{@ layout "partials/layout.htm"@}
{@ header (title) <header><h1>{= title =}</h1></header> @}
{@ main () <main></main> @}
{@ footer () <footer></footer> @}
{~ layout("Page Title", header, main, footer) ~}`, {
        import: s => s === "partials/layout.htm" ? `{@ title, header, main, footer @}
<html>
<head><title>{= title =}</title></head>
<body>{~ header(title) ~}{~ main() ~}{~ footer() ~}</body>
</html>` : ''
    })()).toBe(`<html>
<head><title>Page Title</title></head>
<body><header><h1>Page Title</h1></header><main></main><footer></footer></body>
</html>`);
    expect(await Nostache(`{@ title @}
{@ layout "partials/layout.htm"@}
{@ header (title) <header><h1>{= title =}</h1></header> @}
{@ main () <main></main> @}
{@ footer () <footer></footer> @}
{~ layout(title, header, main, footer) ~}`, {
        import: s => s === "partials/layout.htm" ? `{@ title, header, main, footer @}
<html>
<head><title>{= title =}</title></head>
<body>{~ header(title) ~}{~ main() ~}{~ footer() ~}</body>
</html>` : ''
    })("Page Title")).toBe(`<html>
<head><title>Page Title</title></head>
<body><header><h1>Page Title</h1></header><main></main><footer></footer></body>
</html>`);
});

test("Throw end of block", async () => {
    await expect(Nostache("<{")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{")()).rejects.toThrow("}>");
    await expect(Nostache("<{<{")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{<{")()).rejects.toThrow("}>");
    await expect(Nostache("abc<{def")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("abc<{def")()).rejects.toThrow("}>");
    await expect(Nostache("abc<{d<{ef")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("abc<{d<{ef")()).rejects.toThrow("}>");

    await expect(Nostache("<div><{{</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{{</div>")()).rejects.toThrow(">}");
    await expect(Nostache("<div><{{>abc</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{{>abc</div>")()).rejects.toThrow("<}");

    await expect(Nostache("<div>{=</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{=</div>")()).rejects.toThrow("{=");
    await expect(Nostache("<div>{~</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{~</div>")()).rejects.toThrow("{~");
    await expect(Nostache("<div><{ {=</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {=</div>")()).rejects.toThrow("{=");
    await expect(Nostache("<div><{ {~</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {~</div>")()).rejects.toThrow("{~");
    await expect(Nostache("<div><{ {= }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {= }></div>")()).rejects.toThrow("{=");
    await expect(Nostache("<div><{ {~ }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {~ }></div>")()).rejects.toThrow("{~");

    await expect(Nostache("<div>{@</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{@</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div>{@ name</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{@ name</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div>{@ name ()</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{@ name ()</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div>{@ 'name'</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div>{@ 'name'</div>")()).rejects.toThrow("@}");

    await expect(Nostache("<div><{ {@</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ name</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ name</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ name ()</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ name ()</div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ 'name'</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ 'name'</div>")()).rejects.toThrow("@}");

    await expect(Nostache("<div><{ {@ }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ }></div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ name }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ name }></div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ name () }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ name () }></div>")()).rejects.toThrow("@}");
    await expect(Nostache("<div><{ {@ 'name' }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ {@ 'name' }></div>")()).rejects.toThrow("@}");

    await expect(Nostache("<{ let a = 1; }><{")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><{")()).rejects.toThrow("}>");
    await expect(Nostache("<{ let a = 1; }><{<{")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><{<{")()).rejects.toThrow("}>");
    await expect(Nostache("<{ let a = 1; }>abc<{def")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }>abc<{def")()).rejects.toThrow("}>");
    await expect(Nostache("<{ let a = 1; }>abc<{d<{ef")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }>abc<{d<{ef")()).rejects.toThrow("}>");

    await expect(Nostache("<{ let a = 1; }><div><{{</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{{</div>")()).rejects.toThrow(">}");
    await expect(Nostache("<{ let a = 1; }><div><{{>abc</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{{>abc</div>")()).rejects.toThrow("<}");

    await expect(Nostache("<{ let a = 1; }><div>{=</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div>{=</div>")()).rejects.toThrow("{=");
    await expect(Nostache("<{ let a = 1; }><div>{~</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div>{~</div>")()).rejects.toThrow("{~");
    await expect(Nostache("<{ let a = 1; }><div><{ {=</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{ {=</div>")()).rejects.toThrow("{=");
    await expect(Nostache("<{ let a = 1; }><div><{ {~</div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{ {~</div>")()).rejects.toThrow("{~");
    await expect(Nostache("<{ let a = 1; }><div><{ {= }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{ {= }></div>")()).rejects.toThrow("{=");
    await expect(Nostache("<{ let a = 1; }><div><{ {~ }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<{ let a = 1 }><div><{ {~ }></div>")()).rejects.toThrow("{~");

    await expect(Nostache("{@ name() <{ @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <{ @}")()).rejects.toThrow("}>");
    await expect(Nostache("{@ name() <{<{ @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <{<{ @}")()).rejects.toThrow("}>");
    await expect(Nostache("{@ name() abc<{def @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() abc<{def @}")()).rejects.toThrow("}>");
    await expect(Nostache("{@ name() abc<{d<{ef @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() abc<{d<{ef @}")()).rejects.toThrow("}>");

    await expect(Nostache("{@ name() <div><{{</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{{</div> @}")()).rejects.toThrow(">}");
    await expect(Nostache("{@ name() <div><{{>abc</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{{>abc</div> @}")()).rejects.toThrow("<}");

    await expect(Nostache("{@ name() <div>{=</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div>{=</div> @}")()).rejects.toThrow("{=");
    await expect(Nostache("{@ name() <div>{~</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div>{~</div> @}")()).rejects.toThrow("{~");
    await expect(Nostache("{@ name() <div><{ {=</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{ {=</div> @}")()).rejects.toThrow("{=");
    await expect(Nostache("{@ name() <div><{ {~</div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{ {~</div> @}")()).rejects.toThrow("{~");
    await expect(Nostache("{@ name() <div><{ {= }></div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{ {= }></div> @}")()).rejects.toThrow("{=");
    await expect(Nostache("{@ name() <div><{ {~ }></div> @}")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("{@ name() <div><{ {~ }></div> @}")()).rejects.toThrow("{~");

    await expect(Nostache("<div><{ let a = ' }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = ' }></div>")()).rejects.toThrow("'");
    await expect(Nostache("<div><{ let a = 'a }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = 'a }></div>")()).rejects.toThrow("'");
    await expect(Nostache("<div><{ let a = '', b = ' }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = '', b = ' }></div>")()).rejects.toThrow("'");
    await expect(Nostache("<div><{ let a = 'a', b = 'b }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = 'a', b = 'b }></div>")()).rejects.toThrow("'");
    await expect(Nostache("<div><{ let a = ` }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = ` }></div>")()).rejects.toThrow("`");
    await expect(Nostache("<div><{ let a = `a }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = `a }></div>")()).rejects.toThrow("`");
    await expect(Nostache("<div><{ let a = ``, b = ` }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = ``, b = ` }></div>")()).rejects.toThrow("`");
    await expect(Nostache("<div><{ let a = `${'a'}`, b = `b }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a = `${'a'}`, b = `b }></div>")()).rejects.toThrow("`");
    await expect(Nostache('<div><{ let a = " }></div>')()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache('<div><{ let a = " }></div>')()).rejects.toThrow('"');
    await expect(Nostache('<div><{ let a = "a }></div>')()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache('<div><{ let a = "a }></div>')()).rejects.toThrow('"');
    await expect(Nostache('<div><{ let a = "", b = ` }></div>')()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache('<div><{ let a = "", b = ` }></div>')()).rejects.toThrow('"');
    await expect(Nostache('<div><{ let a = "a", b = `b }></div>')()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache('<div><{ let a = "a", b = `b }></div>')()).rejects.toThrow('"');

    await expect(Nostache("<div><{ /* }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ /* }></div>")()).rejects.toThrow("*/");
    await expect(Nostache("<div><{ /* a }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ /* a }></div>")()).rejects.toThrow("*/");
    await expect(Nostache("<div><{ let a /**/ = 10; /* }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a /**/ = 10; /* }></div>")()).rejects.toThrow("*/");
    await expect(Nostache("<div><{ let a /**/ = 10; /* a }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ let a /**/ = 10; /* a }></div>")()).rejects.toThrow("*/");
    await expect(Nostache("<div><{ // }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ // }></div>")()).rejects.toThrow("}>");
    await expect(Nostache("<div><{ // a }></div>")()).rejects.toBeInstanceOf(SyntaxError);
    await expect(Nostache("<div><{ // a }></div>")()).rejects.toThrow("}>");
    await expect(Nostache(`<div><{ //
}></div>`)()).resolves.toBe("<div></div>");
    await expect(Nostache(`<div><{ // a
}></div>`)()).resolves.toBe("<div></div>");
    await expect(Nostache(`<div><{ //
// a
}></div>`)()).resolves.toBe("<div></div>");
});

test("Readme examples", async () => {
    Nostache.options.cache = "function";
    expect(await Nostache(`<ul><{ for (let i=0; i<3; i++) }>
    <li></li><{}>
</ul>`)()).toBe(`<ul>
    <li></li>
    <li></li>
    <li></li>
</ul>`);
    expect(await Nostache("<span><{ for (let i=0; i<3; i++) {>A<} {>B<} }></span>")()).toBe("<span>AAAB</span>");
    expect(await Nostache(`{@ numberOfItems /* {@ @} defines a list of template parameters */ @}
<ul><{ // Inside <{ }> is plain JS
    for (let i = 0; i < numberOfItems; i++) {
        // JS code supports html inside any braces {}
        <li>Item #{= i + 1 =}</li> // {= =} is html-escaped output
    }
}></ul>`)(3)).toBe(`<ul><li>Item #1</li><li>Item #2</li><li>Item #3</li></ul>`);
    expect(await Nostache(`<p><{ for (let i = 0; i < 3; i++) }><br><{}></p>`)()).toBe("<p><br><br><br></p>");
    expect(await Nostache(`<p><{ for (let i = 0; i < 3; i++) { <br> } }></p>`)()).toBe("<p><br><br><br></p>");
    expect(await Nostache(`<p><{ for (let i = 0; i < 3; i++) {> Br<} }> </p>`)()).toBe("<p> Br Br Br </p>");
    expect(await Nostache(`<p><{ for (let i = 0; i < 3; i++) {><br> <} }></p>`)()).toBe("<p><br> <br> <br> </p>");
    expect(await Nostache(`<p><{ for (let i = 0; i < 3; i++) {>/*!*/<br><} }></p>`)()).toBe("<p>/*!*/<br>/*!*/<br>/*!*/<br></p>");
    expect(await Nostache(`<p>{= "Safe & Unsafe" =}</p>`)()).toBe("<p>Safe &#38; Unsafe</p>");
    expect(await Nostache(`<p>{~ "Safe & Unsafe" ~}</p>`)()).toBe("<p>Safe & Unsafe</p>");
    expect(await Nostache(`<p>{~  ~}</p>`)()).toBe("<p>  </p>");
    expect(await Nostache(`<p>{~
~}</p>`)()).toBe(`<p>
</p>`);
    expect(await Nostache(`{"quote": "{= '"' =}"}`, {
        escape: s => s.replace(/"/, '\\"')
    })()).toBe(`{"quote": "\\""}`);
    expect(await Nostache(`{@ /* Meet template parameters! */ a, b @} <p>{= a =} {= b =}</p>`)(1, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ {a}, b @} <p>{= a =} {= b =}</p>`)({a: 1}, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ , a, , b @} <p>{= a =} {= b =}</p>`)(0.5, 1, 1.5, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ ...a @} <p>{= a[1] =} {= a[2] =}</p>`)(0, 1, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ a, b = 2 @} <p>{= a =} {= b =}</p>`)(1)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ a, b @} <p>{= a =} {= b =}</p>{@ c, d @} <p>{= c =} {= d =}</p>`)(1, 2)).toBe("<p>1 2</p><p>1 2</p>");
    expect(await Nostache(`{@ /* Meet inner template! */ li (i) <li>{= i =}</li> @}
<ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)()).toBe(`<ul>
    <li>1</li>
    <li>2</li>
</ul>`);
    expect(await Nostache(`<{ const li = {@ (i) <li>{= i =}</li> @} }><ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)()).toBe(`<ul>
    <li>1</li>
    <li>2</li>
</ul>`);
    expect(await Nostache(`{@ li (i) <li>{= this[0] =} #{= i =}</li> @}
<ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)("Item")).toBe(`<ul>
    <li>Item #1</li>
    <li>Item #2</li>
</ul>`);
    expect(await Nostache(`{@ tr (row, columns)
    <tr>{@ td (column) <td>{= row + 1 =} {= column + 1 =}</td> @}
        <{ for (let i = 0; i < columns; i++) {~ td(i) ~} }></tr> @}
<table>
    {~ tr(0, 3) ~}
    {~ tr(1, 3) ~}
    {~ tr(2, 3) ~}
</table>`)()).toBe(`<table>
    <tr><td>1 1</td><td>1 2</td><td>1 3</td></tr>
    <tr><td>2 1</td><td>2 2</td><td>2 3</td></tr>
    <tr><td>3 1</td><td>3 2</td><td>3 3</td></tr>
</table>`);
    expect(await Nostache(`<p>{= this[0] =} {= this[1] =}</p>`)(1, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`<{ const [a, b] = this; }><p>{= a =} {= b =}</p>`)(1, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`{@ a, b @}<p>{= a =} {= b =}</p>`)(1, 2)).toBe("<p>1 2</p>");
    expect(await Nostache(`<code>{~ this.escape("<br>") ~}</code>`)()).toBe("<code>&#60;br&#62;</code>");
    expect(await Nostache(`<code>{= "<br>" =}</code>`)()).toBe("<code>&#60;br&#62;</code>");
    expect(await Nostache(`<code>{= "<br>" =}</code>`, {escape: s => s.toUpperCase()})()).toBe("<code><BR></code>");
    expect(await Nostache(`<code>{= "<br>" =}</code>`, {escape: s => new Promise(r => r(s.toUpperCase()))})()).toBe("<code><BR></code>");
    expect(await Nostache(`<div>{@ i @} {= i =}<{ if (i > 1) {~ this(i - 1) ~} }></div>`)(3)).toBe("<div>3<div>2<div>1</div></div></div>");
    expect(await Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
        import: s => `<b>{= this[0] =}</b>`
    })()).toBe("<div><b>1</b><b>2</b></div>");
    expect(await Nostache(`<div><{ const inner = {@ "inner.htm" @} }>{~ inner(1) ~}{~ inner(2) ~}</div>`, {
        import: s => `<b>{= this[0] =}</b>`
    })()).toBe("<div><b>1</b><b>2</b></div>");
    expect(await Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
        import: s => new Promise(r => r(`<b>{= this[0] =}</b>`))
    })()).toBe("<div><b>1</b><b>2</b></div>");
    expect(await Nostache(`<div>{~ this.import("inner.htm") ~}</div>`, {
        import: s => `<p>Not a template</p>`
    })()).toBe("<div><p>Not a template</p></div>");
    expect(await Nostache(`<div>{@ inner "inner.htm" @}
{~ inner ~}</div>`, {
        import: s => `<p>Not a template</p>`
    })()).toBe("<div><p>Not a template</p></div>");
    expect(await Nostache(`<p>{= this.myDream() =}</p>`, {
        extensions: {
            myDream: () => "Pineapple Pizza"
        }
    })()).toBe("<p>Pineapple Pizza</p>");
    expect(await Nostache(`<p>{= this.myDream() =}</p>`, {
        extensions: {
            myDream: () => new Promise(r => r("Pineapple Pizza"))
        }
    })()).toBe("<p>Pineapple Pizza</p>");
    expect(await Nostache(`{~ "<{{={~{@ @}~}=}}>" ~}`)()).toBe("<{{={~{@ @}~}=}}>");
    expect(await Nostache(`<{let s = "<{{={~{@ @}~}=}}>" }>{~ s ~}`)()).toBe("<{{={~{@ @}~}=}}>");
    expect(await Nostache(`{~ /* <{{={~{@ @}~}=}}> */ ~}`)()).toBe("");
    expect(await Nostache(`{~ // <{{={~{@ @}~}=}}>
~}`)()).toBe("");
    expect(await Nostache(`<p>{= new Promise(r => r(1)) =}</p>`)()).toBe("<p>1</p>");
    expect(await Nostache(`<p>{~ new Promise(r => r(1)) ~}</p>`)()).toBe("<p>1</p>");
    expect(await Nostache(`<code>{~ this.escape("<br>") ~}</code>`, {
        escape: s => new Promise(r => r(s.toUpperCase()))
    })()).toBe("<code><BR></code>");
    expect(await Nostache(`<div>{~ this.import("inner.htm")(1) ~}</div>`, {
        import: s => new Promise(r => r("<p>{= this[0] =}</p>"))
    })()).toBe("<div><p>1</p></div>");
    expect(await Nostache(new Promise(r => r("I told {= this[0] =} so!")))("you")).toBe("I told you so!");
    expect(await Nostache(`<p><{ if ('stars are aligned') return; }></p>`)()).toBe("<p>");
    expect(await Nostache(`<p><{ if ('stars are aligned') return 'exit'; }></p>`)()).toBe("<p>exit");
    expect(await Nostache(`{~ this.import("test/partials/page.html")() ~}`)()).toBe(`<html>
<head>
    <title>My Page Title</title>
</head>
<body>
<main>
    <h1>My Page Title</h1>
</main>
</body>
</html>`);
    delete Nostache.options.cache;
});

test("Empty blocks", async () => {
    expect(await Nostache("<ul><{ }></ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul><{ {<>} }></ul>")()).toBe("<ul><></ul>");
    expect(await Nostache("<ul><{ {< >} }></ul>")()).toBe("<ul>< ></ul>");
    expect(await Nostache("<ul><{ {><} }></ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul><{ {> <} }></ul>")()).toBe("<ul> </ul>");
    expect(await Nostache("<ul>{==}</ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul>{= =}</ul>")()).toBe("<ul> </ul>");
    expect(await Nostache("<ul>{~~}</ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul>{~ ~}</ul>")()).toBe("<ul> </ul>");
    expect(await Nostache("<ul>{@@}</ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul>{@ @}</ul>")()).toBe("<ul></ul>");
});

test("Early return", async () => {
    expect(await Nostache("<ul><{ if (true) return; }></ul>")()).toBe("<ul>");
    expect(await Nostache("<ul><{ if (false) return }></ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul><{ if (true) return 'exit' }></ul>")()).toBe("<ul>exit");
    expect(await Nostache("<ul><{ if (false) return 'exit' }></ul>")()).toBe("<ul></ul>");
    expect(await Nostache("<ul><{ if (true) return new Promise(r => r('exit')) }></ul>")()).toBe("<ul>exit");
    expect(await Nostache("<ul><{ if (false) return new Promise(r => r('exit')) }></ul>")()).toBe("<ul></ul>");
});

test("Direct import", async () => {
    let importCalled = 0;
    const options = {
        import: v => {
            importCalled++;
            return v === 'partials/li.htm' ? "<li>{~ this[0] + 1 ~}</li>" : "";
        },
        cache: false,
    };
    await Nostache("<{ const p = this.import('partials/li.htm') }>", options)();
    await Nostache("<{ {@ p 'partials/li.htm' @} }>", options)();
    await Nostache("{@ p 'partials/li.htm' @}", options)();
    expect(importCalled).toBe(0);
    expect(await Nostache("{~ this.import('partials/li.htm') ~}", options)()).toBe("<li>{~ this[0] + 1 ~}</li>");
    await expect(Nostache("{~ {@ 'partials/li.htm' @} ~}", options)()).rejects.toBeInstanceOf(SyntaxError);
    expect(importCalled).toBe(1);
    expect(await Nostache("<{ const p = this.import('partials/li.htm') }>{~ p ~}", options)()).toBe("<li>{~ this[0] + 1 ~}</li>");
    expect(importCalled).toBe(2);
    expect(await Nostache("{@ p 'partials/li.htm' @}{~ p ~}", options)()).toBe("<li>{~ this[0] + 1 ~}</li>");
    expect(importCalled).toBe(3);

    expect(await Nostache("{= this.import('partials/li.htm') =}", options)()).toBe("&#60;li&#62;{~ this[0] + 1 ~}&#60;/li&#62;");
    await expect(Nostache("{= {@ 'partials/li.htm' @} =}", options)()).rejects.toBeInstanceOf(SyntaxError);
    expect(importCalled).toBe(4);
    expect(await Nostache("<{ const p = this.import('partials/li.htm') }>{= p =}", options)()).toBe("&#60;li&#62;{~ this[0] + 1 ~}&#60;/li&#62;");
    expect(importCalled).toBe(5);
    expect(await Nostache("{@ p 'partials/li.htm' @}{= p =}", options)()).toBe("&#60;li&#62;{~ this[0] + 1 ~}&#60;/li&#62;");
    expect(importCalled).toBe(6);
});