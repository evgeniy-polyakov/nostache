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
    expect(await Nostache("<{ if (true) }><p>simple text</p><;>")()).toBe("<p>simple text</p>");
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

test("Mixed blocks", async () => {
    expect(await Nostache("<p><{ if (true) { <b>simple text</b> }}></p>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<p><{ if (true) }>simple text<;></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("<p><{ if (true) {}>simple text<{}}></p>")()).toBe("<p>simple text</p>");
    expect(await Nostache("one<{ if (true) }>simple text<;>two")()).toBe("onesimple texttwo");
    expect(await Nostache("one<{ if (true) }> simple text <;>two")()).toBe("one simple text two");
});

test("Nested blocks", async () => {
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b>simple text</b> }}></p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(await Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><;> text</b> }}></p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
});

test("Whitespace", async () => {
    expect(await Nostache(" <{ }> ")()).toBe("  ");
    expect(await Nostache(" <{ <p>simple text</p> }> ")()).toBe(" <p>simple text</p> ");
    expect(await Nostache(" <{ if (true) { <p>simple text</p> } }> ")()).toBe(" <p>simple text</p> ");
    expect(await Nostache(" <{ if (true) }> <p>simple text</p> <;> ")()).toBe("  <p>simple text</p>  ");
    expect(await Nostache("<div> <{ if (true) { <p>simple text</p> } }> </div>")()).toBe("<div> <p>simple text</p> </div>");
    expect(await Nostache(" <div> <{ if (true) { <p>simple text</p> } }> </div> ")()).toBe(" <div> <p>simple text</p> </div> ");
    expect(await Nostache(" <{ if (true) { <div> <{ if (true) { <p>simple text</p> }}> </div> }}> ")()).toBe(" <div> <p>simple text</p> </div> ");
});

test("Escape", async () => {
    expect(await Nostache(`<p>"'\\"'\\<{ if (true) { <b>simple"'\\"'\\text</b> }}>\\'"\\'"</p>`)()).toBe(`<p>"'\\"'\\<b>simple"'\\"'\\text</b>\\'"\\'"</p>`);
    expect(await Nostache(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`)()).toBe(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`);
    expect(await Nostache("<<{")()).toBe("<{");
    expect(await Nostache("<<<{")()).toBe("<<{");
    expect(await Nostache(" <<{ ")()).toBe(" <{ ");
    expect(await Nostache("test<<{test")()).toBe("test<{test");
    expect(await Nostache("<p><<{</p>")()).toBe("<p><{</p>");
    expect(await Nostache("<p> <<{ </p>")()).toBe("<p> <{ </p>");
    expect(await Nostache("test <<{ test")()).toBe("test <{ test");
    expect(await Nostache("=={")()).toBe("={");
    expect(await Nostache("==={")()).toBe("=={");
    expect(await Nostache(" =={ ")()).toBe(" ={ ");
    expect(await Nostache("test=={test")()).toBe("test={test");
    expect(await Nostache("<p>=={</p>")()).toBe("<p>={</p>");
    expect(await Nostache("<p> =={ </p>")()).toBe("<p> ={ </p>");
    expect(await Nostache("test =={ test")()).toBe("test ={ test");
    expect(await Nostache("<<{}>")()).toBe("<{}>");
    expect(await Nostache(" <<{ }>")()).toBe(" <{ }>");
    expect(await Nostache("test<<{test}>")()).toBe("test<{test}>");
    expect(await Nostache("<p><<{</p>}>")()).toBe("<p><{</p>}>");
    expect(await Nostache("<p> <<{ </p>}>")()).toBe("<p> <{ </p>}>");
    expect(await Nostache("test <<{ test}>")()).toBe("test <{ test}>");
    expect(await Nostache("=={}>")()).toBe("={}>");
    expect(await Nostache(" =={ }>")()).toBe(" ={ }>");
    expect(await Nostache("test=={test}>")()).toBe("test={test}>");
    expect(await Nostache("<p>=={</p>}>")()).toBe("<p>={</p>}>");
    expect(await Nostache("<p> =={ </p>}>")()).toBe("<p> ={ </p>}>");
    expect(await Nostache("test =={ test}>")()).toBe("test ={ test}>");
});

test("Output expressions", async () => {
    expect(await Nostache("={ 10 }>")()).toBe("10");
    expect(await Nostache("={ 5 + 5 }>")()).toBe("10");
    expect(await Nostache("={ 'aa' }>")()).toBe("aa");
    expect(await Nostache("={ {a:'aa'}.a }>")()).toBe("aa");
    expect(await Nostache("={ (()=> 'aa')() }>")()).toBe("aa");
    expect(await Nostache("={ 10 }> ={ 'aa' }>")()).toBe("10 aa");
    expect(await Nostache("<p>={ 10 }></p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>={ 5 + 5 }></p>")()).toBe("<p>10</p>");
    expect(await Nostache("<p>={ 'aa' }></p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>={ {a:'aa'}.a }></p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>={ (() => 'aa')() }></p>")()).toBe("<p>aa</p>");
    expect(await Nostache("<p>={ 10 }></p>={ 'aa' }>")()).toBe("<p>10</p>aa");
    expect(await Nostache("<{ if (true) {<p>={ 10 }></p>}}>")()).toBe("<p>10</p>");
    expect(await Nostache("<{ if (true) {<p>={ 5 + 5 }></p>}}>")()).toBe("<p>10</p>");
    expect(await Nostache("<{ if (true) {<p>={ 5 + 5 }></p>={'aa'}>}}>")()).toBe("<p>10</p>aa");
});

test("This argument", async () => {
    expect(await Nostache("={ this }>")(10)).toBe("10");
    expect(await Nostache("={ this }>")(true)).toBe("true");
    expect(await Nostache("={ this }>")("")).toBe("");
    expect(await Nostache("={ this.a }>")({a: 'aa'})).toBe("aa");
    expect(await Nostache("<p>={ this }></p>")(10)).toBe("<p>10</p>");
    expect(await Nostache("<p>={ this }></p>")(true)).toBe("<p>true</p>");
    expect(await Nostache("<p>={ this }></p>")("")).toBe("<p></p>");
    expect(await Nostache("<p>={ this.a }></p>")({a: 'aa'})).toBe("<p>aa</p>");
    expect(await Nostache("<{if (true) {<p>={ this }></p>} }>")(10)).toBe("<p>10</p>");
    expect(await Nostache("<{if (true) {<p>={ this }></p>} }>")(true)).toBe("<p>true</p>");
    expect(await Nostache("<{if (true) {<p>={ this }></p>} }>")("")).toBe("<p></p>");
    expect(await Nostache("<{if (true) {<p>={ this.a }></p>} }>")({a: 'aa'})).toBe("<p>aa</p>");
});

test("Arguments", async () => {
    expect(await Nostache("={ a }>")({a: 'bb'})).toBe("bb");
    expect(await Nostache("={ A }>")({A: 'bb'})).toBe("bb");
    expect(await Nostache("={ _a }>")({_a: 'bb'})).toBe("bb");
    expect(await Nostache("<p>={ a }></p>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<p>={ A }></p>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<p>={ _a }></p>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>={ a }></p>} }>")({a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>={ A }></p>} }>")({A: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (true) {<p>={ _a }></p>} }>")({_a: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (a) {<p>={ b }></p>} }>")({a: true, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (!a) {<p>={ b }></p>} }>")({a: false, b: 'bb'})).toBe("<p>bb</p>");
    expect(await Nostache("<{if (!a) {<p>={ b }></p>} }>")({a: true, b: 'bb'})).toBe("");
    expect(await Nostache("<{if (a) {<p>={ b }></p>} }>")({a: false, b: 'bb'})).toBe("");
    expect(await Nostache("={a}> ={b}>")({a: 'aa', b: 'bb'})).toBe("aa bb");
    expect(await Nostache("={a}> ={b.c}>")({a: 'aa', b: {c: 'bb'}})).toBe("aa bb");
    await (expect(Nostache("={ c }>")({a: 'aa', b: 'bb'}))).rejects.toBeInstanceOf(ReferenceError);
    await (expect(async () => {
        const t = Nostache("={ a }>");
        t.contextDecomposition = false;
        await t({a: "aa"});
    })).rejects.toBeInstanceOf(ReferenceError);
    expect(await Nostache("={a}> ={b}>")(Object.create({a: 'aa', b: 'bb'}))).toBe("aa bb");
});

test("Arguments Mutation", async () => {
    expect(await Nostache("={ a++ }><p>={ a }></p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("={ ++a }><p>={ a }></p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("={ a = 'bb'; }><p>={ a }></p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("={ a }><{ a = 'bb'; }><p>={ a }></p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("={ this.a++ }><p>={ this.a }></p>")({a: 0})).toBe("0<p>1</p>");
    expect(await Nostache("={ ++this.a }><p>={ this.a }></p>")({a: 0})).toBe("1<p>1</p>");
    expect(await Nostache("={ this.a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'})).toBe("bb<p>bb</p>");
    expect(await Nostache("={ this.a }><{ this.a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'})).toBe("aa<p>bb</p>");
    expect(await Nostache("={ this.a++ }><p>={ a }></p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("={ ++this.a }><p>={ a }></p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("={ this.a = 'bb'; }><p>={ a }></p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("={ this.a }><{ this.a = 'bb'; }><p>={ a }></p>")({a: 'aa'})).toBe("aa<p>aa</p>");
    expect(await Nostache("={ a++ }><p>={ this.a }></p>")({a: 0})).toBe("0<p>0</p>");
    expect(await Nostache("={ ++a }><p>={ this.a }></p>")({a: 0})).toBe("1<p>0</p>");
    expect(await Nostache("={ a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'})).toBe("bb<p>aa</p>");
    expect(await Nostache("={ a }><{ a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'})).toBe("aa<p>aa</p>");
});