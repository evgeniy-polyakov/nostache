const Nostache = require("../dist/nostache.js");

Nostache.verbose = true;

test("Simple text", async () => {
    expect(await Nostache("")()).toBe("");
    expect(await Nostache("simple text")()).toBe("simple text");
    expect(await Nostache("first line\nsecond line\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(await Nostache("first line\r\nsecond line\r\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(await Nostache(`first line
second line
third line`)()).toBe("first line\nsecond line\nthird line");
});

test("HTML Tags", async () => {
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
    expect(await Nostache("<{>simple text<}>")()).toBe("simple text");
    expect(await Nostache(`<{>
    simple text
    <}>`)()).toBe("simple text");
    expect(await Nostache("<{> a<p><b>simple</b> text</p>a <}>")()).toBe("a<p><b>simple</b> text</p>a");
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
    expect(await Nostache(`<script>let o = {"a": "{=a=}", "b": "{=b=}"};</script>`)({a:1,b:2})).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<script>let o = {"a": "{=a=}"<{if (b) }>, "b": "{=b=}"<{}>};</script>`)({a:1,b:2})).toBe(`<script>let o = {"a": "1", "b": "2"};</script>`);
    expect(await Nostache(`<script>let o = {"a": "{=a=}"<{if (!b) {
}>, "b": "{=b=}"<{
}}>};</script>`)({a:1,b:2})).toBe(`<script>let o = {"a": "1"};</script>`);
    expect(await Nostache(`<script><{if (a) {}>if (a) {console.log(a);}<{}}></script>`)({a:1})).toBe(`<script>if (a) {console.log(a);}</script>`);
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

test("Output in logic expressions", async () => {
    expect(await Nostache(`<{{=10=}}>`)()).toBe("10");
    expect(await Nostache(`<{{="<>&'\\""=}}>`)()).toBe("&#60;&#62;&#38;&#39;&#34;");
    expect(await Nostache(`<{ {= 10 =} }>`)()).toBe("10");
    expect(await Nostache(`<{ {= "<>&'\\"" =} }>`)()).toBe("&#60;&#62;&#38;&#39;&#34;");
    expect(await Nostache(`<p><{ const a = 10; {<a>{=a=}</a>} }></p>`)()).toBe("<p><a>10</a></p>");
    expect(await Nostache(`<{{~"<>&'\\""~}}>`)()).toBe("<>&'\"");
    expect(await Nostache(`<{ {~ 10 ~} }>`)()).toBe("10");
    expect(await Nostache(`<p><{ const a = 10; {<a>{=a=}</a>} }></p>`)()).toBe("<p><a>10</a></p>");
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
    expect(await Nostache("<{if (true) {<p>{= a =}</p><p>{= b =}</p>} }>")({a: 0}, {a: 'aa', b: 'bb'})).toBe("<p>aa</p><p>bb</p>");
});

test("Arguments", async () => {
    expect(await Nostache("{= a =}")({a: 'bb'})).toBe("bb");
    expect(await Nostache("{= A =}")({A: 'bb'})).toBe("bb");
    expect(await Nostache("{= _a =}")({_a: 'bb'})).toBe("bb");
    expect(await Nostache("<p>{= a =}</p>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<p>{= A =}</p>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<p>{= _a =}</p>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>{= a =}</p>} }>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>{= A =}</p>} }>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>{= _a =}</p>} }>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (a) {<p>{= b =}</p>} }>")({a: true, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (!a) {<p>{= b =}</p>} }>")({a: false, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (!a) {<p>{= b =}</p>} }>")({a: true, b: 'bb'})).toBe("");
    expect(await Nostache("<{if (a) {<p>{= b =}</p>} }>")({a: false, b: 'bb'})).toBe("");
    expect(await Nostache("{=a=} {=b=}")({a: 'aa', b: 'bb'})).toBe("aa bb");
    expect(await Nostache("{=a=} {=b.c=}")({a: 'aa', b: {c: 'bb'}})).toBe("aa bb");
    await (expect(Nostache("{= c =}")({a: 'aa', b: 'bb'}))).rejects.toBeInstanceOf(ReferenceError);
    expect(await Nostache("{=a=} {=b=}")(Object.create({a: 'aa', b: 'bb'}))).toBe("aa bb");
});

test("Arguments Mutation", async () => {
    expect(await Nostache("{= a++ =}<p>{= a =}</p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("{= ++a =}<p>{= a =}</p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("{= a = 'bb' =}<p>{= a =}</p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("{= a =}<{ a = 'bb'; }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("{= this[0].a++ =}<p>{= this[0].a =}</p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("{= ++this[0].a =}<p>{= this[0].a =}</p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("{= this[0].a = 'bb' =}<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("{= this[0].a =}<{ this[0].a = 'bb'; }><p>{= this[0].a =}</p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("{= this[0].a++ =}<p>{= a =}</p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("{= ++this[0].a =}<p>{= a =}</p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("{= this[0].a = 'bb' =}<p>{= a =}</p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("{= this[0].a =}<{ this[0].a = 'bb'; }><p>{= a =}</p>")({a: 'aa'})).toBe("aa<p>aa</p>");
    expect(await Nostache("{= a++ =}<p>{= this[0].a =}</p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("{= ++a =}<p>{= this[0].a =}</p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("{= a = 'bb' =}<p>{= this[0].a =}</p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("{= a =}<{ a = 'bb'; }><p>{= this[0].a =}</p>")({a: 'aa'})).toBe("aa<p>aa</p>");
});

test("Promises", async () => {
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 10))=}")()).toBe("1");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 10))=} {=new Promise(r => setTimeout(() => r(2), 20))=}")()).toBe("1 2");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 20))=} {=new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    expect(await Nostache("{=new Promise(r => setTimeout(() => r(1), 20))=} {=new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 10))=}")()).toBe("1");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 10))=} {=await new Promise(r => setTimeout(() => r(2), 20))=}")()).toBe("1 2");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 20))=} {=await new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    expect(await Nostache("{=await new Promise(r => setTimeout(() => r(1), 20))=} {=await new Promise(r => setTimeout(() => r(2), 10))=}")()).toBe("1 2");
    expect(await Nostache("<{let a = 1;}>{=new Promise(r => setTimeout(() => r(a), 10))=}<{a++;}> {=new Promise(r => setTimeout(() => r(a), 10))=}")()).toBe("1 2");
    expect(await Nostache("<{let a = 1;}>{=await new Promise(r => setTimeout(() => r(a), 10))=}<{a++;}> {=await new Promise(r => setTimeout(() => r(a), 10))=}")()).toBe("1 2");
    expect(await Nostache("<{let a = 1; const p = new Promise(r => setTimeout(() => r(a), 10));}>{=p=}<{a++;}> {=p=}")()).toBe("1 1");
});

test("Recursive templates", async () => {
    expect(await Nostache("<li>{= this[0] =}</li><{if (this[0] < 13) }>{~ this(this[0] + 1) ~}")(10)).toBe("<li>10</li><li>11</li><li>12</li><li>13</li>");
    expect(await Nostache("<li>{= a =}</li><{if (a < 13) }>{~ this({a:++a}) ~}")({a: 10})).toBe("<li>10</li><li>11</li><li>12</li><li>13</li>");
});