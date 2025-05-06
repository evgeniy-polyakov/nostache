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
    expect(await Nostache("<{ <p>simple text</p> }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{
    <p>simple text</p>
    }>`)()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ <p><b>simple</b> text</p> }>")()).toBe("<p><b>simple</b> text</p>");
    expect(await Nostache("<{ if (true) {<p>simple text</p>} }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ if (true) {
    <p>simple text</p>
    } }>`)()).toBe("<p>simple text</p>");
    expect(await Nostache("<{ if (true) {<p><b>simple</b> text</p>} }>")()).toBe("<p><b>simple</b> text</p>");
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
    expect(await Nostache("<{{>simple text<}}>")()).toBe("simple text");
    expect(await Nostache(`<{{>
    simple text
    <}}>`)()).toBe("simple text");
    expect(await Nostache("<{{> a<p><b>simple</b> text</p>a <}}>")()).toBe("a<p><b>simple</b> text</p>a");
    expect(await Nostache("<{ if (true) {> a<p>simple text</p>a <} }>")()).toBe("a<p>simple text</p>a");
    expect(await Nostache(`<{ if (true) {>
    _<p>simple text</p>_
    <} }>`)()).toBe("_<p>simple text</p>_");
    expect(await Nostache("<{ if (false) {>false<} else {> p>simple text<p <}}>")()).toBe("p>simple text<p");
    expect(await Nostache("<{ if (true) {>true<} }><p>simple text</p>")()).toBe("true<p>simple text</p>");
    expect(await Nostache("<{ if (false) {>false<p>simple text</p><}}>")()).toBe("");
    expect(await Nostache("<{ if (false) {><p>error</p><} else {><p>simple text</p><} }>")()).toBe("<p>simple text</p>");
    expect(await Nostache(`<{ if (false) {>
    p>error</p
    <} else {>
    p>simple text</p
    <} }>`)()).toBe("p>simple text</p");
    expect(await Nostache("<{ let i = 0; while (i === 0) {i++; {>p>simple text</p<}}}>")()).toBe("p>simple text</p");
    expect(await Nostache(`<{ let i = 0; while (i === 0) {i++; {>
    p>simple text</p
    <}}}>`)()).toBe("p>simple text</p");
});

test("Mixed blocks", async () => {
    expect(await Nostache("<p><{ if (true) { <b>simple text</b> }}></p>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<p><{ if (true) }>simple text<{}></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<p><{ if (true) {}>simple text<{}}></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("one<{ if (true) }>simple text<{}>two")()).toBe("onesimple texttwo");
    expect(await Nostache("one<{ if (true) }> simple text <{}>two")()).toBe("one simple text two");
    expect(await Nostache("one <{ if (true) {> simple text <}}> two")()).toBe("one simple text two");
});

test("Nested blocks", async () => {
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b>simple text</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><{}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
});

test("Script blocks", async () => {
    expect(await Nostache(`<{ const [a,b] = this; }><script>let o = {"a": "{=a=}", "b": "{=b=}"};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<{ const [a,b] = this; }><script>let o = {"a": "{=a=}"<{if (b) }>, "b": "{=b=}"<{}>};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<{ const [a,b] = this; }><script>let o = {"a": "{=a=}"<{if (!b) {
}>, "b": "{=b=}"<{
}}>};</script>`)(1, 2)).toBe(`<script>let o = {"a": "1"};</script>`);
    expect(await Nostache(`<{ const [a] = this; }><script><{if (a) {}>if (a) {console.log(a);}<{}}></script>`)(1)).toBe(`<script>if (a) {console.log(a);}</script>`);
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
    expect(await Nostache(" <{ <p>simple text</p> }> ")()).toBe(" <p>simple text</p> ");
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
});

test("Output expressions", async () => {
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
    expect(await Nostache("<{ if (true) {<p>{= 5 + 5 =}</p>{='aa'=}}}>")()).toBe("<p>10</p>aa");
});

test("Unsafe output expressions", async () => {
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
    expect(await Nostache("<{ if (true) {<p>{~ 5 + 5 ~}</p>{~'aa'~}}}>")()).toBe("<p>10</p>aa");
});

test("Safe output", async () => {
    expect(await Nostache(`<p>{= "<p>&'\\"" =}</p>`)()).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p>{= this[0] =}</p>`)("<p>&'\"")).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p>{= new Promise(r => r(this[0])) =}</p>`)("<p>&'\"")).toBe("<p>&#60;p&#62;&#38;&#39;&#34;</p>");
    expect(await Nostache(`<p class="{= "<p>&'\\"" =}"></p>`)()).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
    expect(await Nostache(`<p class="{= this[0] =}"></p>`)("<p>&'\"")).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
    expect(await Nostache(`<p class="{= new Promise(r => r(this[0])) =}"></p>`)("<p>&'\"")).toBe(`<p class="&#60;p&#62;&#38;&#39;&#34;"></p>`);
});

test("Strings in output expressions", async () => {
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

test("Strings in logic expressions", async () => {
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

test("Comments in output expressions", async () => {
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

test("Comments in logic expressions", async () => {
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

test("Output in logic expressions", async () => {
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
    expect(await Nostache("<{let [{a}] = this;}>{= a =}<{ a = 'bb'; }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a++ =}<p>{= this[0].a =}</p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++this[0].a =}<p>{= this[0].a =}</p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("{= this[0].a = 'bb' =}<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("{= this[0].a =}<{ this[0].a = 'bb'; }><p>{= this[0].a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a++ =}<p>{= a =}</p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= ++this[0].a =}<p>{= a =}</p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a = 'bb' =}<p>{= a =}</p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("<{let [{a}] = this;}>{= this[0].a =}<{ this[0].a = 'bb'; }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>aa</p>");
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
    expect(await Nostache("<{ {@ a, b @} let c = 12; }>{= a =}{= b =}{= c =}")(10, 11)).toBe("101112");
    expect(await Nostache("<{ let c = 12; {@ a, b @} }>{= a =}{= b =}{= c =}")(10, 11)).toBe("101112");
    expect(await Nostache("<{ let c = 12; {@ a, b @} let d = 13; }>{= a =}{= b =}{= c =}{= d =}")(10, 11)).toBe("10111213");
    expect(await Nostache("{@ {a, b} @}  {= a =}{= b =}")({a: 10, b: 11})).toBe("1011");
    expect(await Nostache("{@ {a:{a}}, [{b}] @}  {= a =}{= b =}")({a: {a: 10}}, [{b: 11}])).toBe("1011");
    expect(await Nostache("{@ [a, b] @}  {= a =}{= b =}")([10, 11])).toBe("1011");
    expect(await Nostache("{@ [{a}, [b]] @}  {= a =}{= b =}")([{a: 10}, [11]])).toBe("1011");
    expect(await Nostache("{@ a, b, ...c @}  {= a =}{= b =}{= c.join('') =}")(10, 11, 12, 13)).toBe("10111213");
    expect(await Nostache("{@ ,b, c = 12 @}  {= b =}{= c =}")(10, 11)).toBe("1112");
});

test("Fetch declaration", async () => {
    Nostache.options.load = v => v === 'partials/li.htm' ? "<li>{~ this[0] + 1 ~}</li>" : "";
    expect(await Nostache("<ul>{@ li '' @}<{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul></ul>");
    expect(await Nostache("<ul>{@ li 'null' @}<{for (let i = 0; i < this[0]; i++) {~ li(i) ~} }></ul>")(1)).toBe("<ul></ul>");

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
});

test("Template declaration", async () => {
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

    Nostache.options.load = v => v === 'partials/td.htm' ? "{@ i, j @}<td>{= i =}{= j =}</td>" : "";
    expect(await Nostache("{@ tr (i) {@ td 'partials/td.htm' @} <tr>{~td(i,1)~}{~td(i,2)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(1))
        .toBe("<table><tr><td>11</td><td>12</td></tr></table>");
    expect(await Nostache("{@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} <table><{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table>{@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} <{for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
    expect(await Nostache("<table><{ {@ tr (i) <tr>{@ td 'partials/td.htm' @} {~td(i,1)~}</tr> @} for (let i = 0; i < this[0]; i++) {~ tr(i + 1) ~} }></table>")(2))
        .toBe("<table><tr><td>11</td></tr><tr><td>21</td></tr></table>");
});

test("To string", async () => {
    const template = Nostache("<a>{= 10 =}</a>");
    const re = /^function[^<]+<a>[^1]+10[^<]+<\/a>/i;
    expect(template.toString()).not.toMatch(re);
    await template();
    expect(template.toString()).toMatch(re);
});