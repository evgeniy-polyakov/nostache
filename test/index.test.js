const Nostache = require("../dist/nostache.js");

Nostache.verbose = true;

test("Simple text", () => {
    expect(Nostache("")()).toBe("");
    expect(Nostache("simple text")()).toBe("simple text");
    expect(Nostache("first line\nsecond line\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(Nostache("first line\r\nsecond line\r\nthird line")()).toBe("first line\nsecond line\nthird line");
    expect(Nostache(`first line
second line
third line`)()).toBe("first line\nsecond line\nthird line");
});

test("HTML Tags", () => {
    expect(Nostache("<p>simple text</p>")()).toBe("<p>simple text</p>");
    expect(Nostache("<p><b>simple</b> text</p>")()).toBe("<p><b>simple</b> text</p>");
});

test("HTML in logic block", () => {
    expect(Nostache("<{ <p>simple text</p> }>")()).toBe("<p>simple text</p>");
    expect(Nostache(`<{
    <p>simple text</p>
    }>`)()).toBe("<p>simple text</p>");
    expect(Nostache("<{ <p><b>simple</b> text</p> }>")()).toBe("<p><b>simple</b> text</p>");
    expect(Nostache("<{ if (true) {<p>simple text</p>} }>")()).toBe("<p>simple text</p>");
    expect(Nostache(`<{ if (true) {
    <p>simple text</p>
    } }>`)()).toBe("<p>simple text</p>");
    expect(Nostache("<{ if (true) {<p><b>simple</b> text</p>} }>")()).toBe("<p><b>simple</b> text</p>");
    expect(Nostache("<{ if (true) }><p>simple text</p><;>")()).toBe("<p>simple text</p>");
    expect(Nostache("<{ if (false) {<p>error</p>} else {<p>simple text</p>} }>")()).toBe("<p>simple text</p>");
    expect(Nostache(`<{ if (false) {
    <p>error</p>
    } else {
    <p>simple text</p>
    } }>`)()).toBe("<p>simple text</p>");
    expect(Nostache("<{ let i = 0; while (i === 0) {i++; { <p>simple text</p> }}}>")()).toBe("<p>simple text</p>");
    expect(Nostache(`<{ let i = 0; while (i === 0) {i++; {
    <p>simple text</p>
    }} }>`)()).toBe("<p>simple text</p>");
});

test("Mixed blocks", () => {
    expect(Nostache("<p><{ if (true) { <b>simple text</b> }}></p>")()).toBe("<p><b>simple text</b></p>");
    expect(Nostache("<p><{ if (true) }>simple text<;></p>")()).toBe("<p>simple text</p>");
    expect(Nostache("one<{ if (true) }>simple text<;>two")()).toBe("onesimple texttwo");
    expect(Nostache("one<{ if (true) }> simple text <;>two")()).toBe("one simple text two");
});

test("Nested blocks", () => {
    expect(Nostache("<{ if (true) { <p><{ if (true) { <b>simple text</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><;> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
});

test("Whitespace", () => {
    expect(Nostache(" <{ }> ")()).toBe("  ");
    expect(Nostache(" <{ <p>simple text</p> }> ")()).toBe(" <p>simple text</p> ");
    expect(Nostache(" <{ if (true) { <p>simple text</p> } }> ")()).toBe(" <p>simple text</p> ");
    expect(Nostache(" <{ if (true) }> <p>simple text</p> <;> ")()).toBe("  <p>simple text</p>  ");
    expect(Nostache("<div> <{ if (true) { <p>simple text</p> } }> </div>")()).toBe("<div> <p>simple text</p> </div>");
    expect(Nostache(" <div> <{ if (true) { <p>simple text</p> } }> </div> ")()).toBe(" <div> <p>simple text</p> </div> ");
    expect(Nostache(" <{ if (true) { <div> <{ if (true) { <p>simple text</p> }}> </div> }}> ")()).toBe(" <div> <p>simple text</p> </div> ");
});

test("Escape", () => {
    expect(Nostache(`<p>"'\\"'\\<{ if (true) { <b>simple"'\\"'\\text</b> }}>\\'"\\'"</p>`)()).toBe(`<p>"'\\"'\\<b>simple"'\\"'\\text</b>\\'"\\'"</p>`);
    expect(Nostache(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`)()).toBe(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`);
    expect(Nostache("<<{")()).toBe("<{");
    expect(Nostache(" <<{ ")()).toBe(" <{ ");
    expect(Nostache("test<<{test")()).toBe("test<{test");
    expect(Nostache("<p><<{</p>")()).toBe("<p><{</p>");
    expect(Nostache("<p> <<{ </p>")()).toBe("<p> <{ </p>");
    expect(Nostache("test <<{ test")()).toBe("test <{ test");
});

test("Output expressions", () => {
    expect(Nostache("={ 10 }>")()).toBe("10");
    expect(Nostache("={ 5 + 5 }>")()).toBe("10");
    expect(Nostache("={ 'aa' }>")()).toBe("aa");
    expect(Nostache("={ {a:'aa'}.a }>")()).toBe("aa");
    expect(Nostache("={ (()=> 'aa')() }>")()).toBe("aa");
    expect(Nostache("={ 10 }> ={ 'aa' }>")()).toBe("10 aa");
    expect(Nostache("<p>={ 10 }></p>")()).toBe("<p>10</p>");
    expect(Nostache("<p>={ 5 + 5 }></p>")()).toBe("<p>10</p>");
    expect(Nostache("<p>={ 'aa' }></p>")()).toBe("<p>aa</p>");
    expect(Nostache("<p>={ {a:'aa'}.a }></p>")()).toBe("<p>aa</p>");
    expect(Nostache("<p>={ (() => 'aa')() }></p>")()).toBe("<p>aa</p>");
    expect(Nostache("<p>={ 10 }></p>={ 'aa' }>")()).toBe("<p>10</p>aa");
    expect(Nostache("<{ if (true) {<p>={ 10 }></p>}}>")()).toBe("<p>10</p>");
    expect(Nostache("<{ if (true) {<p>={ 5 + 5 }></p>}}>")()).toBe("<p>10</p>");
    expect(Nostache("<{ if (true) {<p>={ 5 + 5 }></p>={'aa'}>}}>")()).toBe("<p>10</p>aa");
});

test("This argument", () => {
    expect(Nostache("={ this }>")(10)).toBe("10");
    expect(Nostache("={ this }>")(true)).toBe("true");
    expect(Nostache("={ this }>")("")).toBe("");
    expect(Nostache("={ this.a }>")({a: 'aa'})).toBe("aa");
    expect(Nostache("<p>={ this }></p>")(10)).toBe("<p>10</p>");
    expect(Nostache("<p>={ this }></p>")(true)).toBe("<p>true</p>");
    expect(Nostache("<p>={ this }></p>")("")).toBe("<p></p>");
    expect(Nostache("<p>={ this.a }></p>")({a: 'aa'})).toBe("<p>aa</p>");
    expect(Nostache("<{if (true) {<p>={ this }></p>} }>")(10)).toBe("<p>10</p>");
    expect(Nostache("<{if (true) {<p>={ this }></p>} }>")(true)).toBe("<p>true</p>");
    expect(Nostache("<{if (true) {<p>={ this }></p>} }>")("")).toBe("<p></p>");
    expect(Nostache("<{if (true) {<p>={ this.a }></p>} }>")({a: 'aa'})).toBe("<p>aa</p>");
});

test("Arguments", () => {
    expect(Nostache("={ a }>")({a: 'bb'})).toBe("bb");
    expect(Nostache("={ A }>")({A: 'bb'})).toBe("bb");
    expect(Nostache("={ _a }>")({_a: 'bb'})).toBe("bb");
    expect(Nostache("<p>={ a }></p>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("<p>={ A }></p>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("<p>={ _a }></p>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("<{if (true) {<p>={ a }></p>} }>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("<{if (true) {<p>={ A }></p>} }>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("<{if (true) {<p>={ _a }></p>} }>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(Nostache("={a}> ={b}>")({a: 'aa', b: 'bb'})).toBe("aa bb");
    expect(Nostache("={a}> ={b.c}>")({a: 'aa', b: {c: 'bb'}})).toBe("aa bb");
    expect(() => Nostache("={ c }>")({a: 'aa', b: 'bb'})).toThrow(ReferenceError);
    expect(Nostache("={a}> ={b}>")(Object.create({a: 'aa', b: 'bb'}))).toBe("aa bb");
});