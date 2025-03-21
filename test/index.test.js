const Nostache = require("../dist/nostache.js");

Nostache.verbose = true;

test("Simple text", async () => {
    (await expect(Nostache("")())).resolves.toBe("");
    (await expect(Nostache("simple text")())).resolves.toBe("simple text");
    (await expect(Nostache("first line\nsecond line\nthird line")())).resolves.toBe("first line\nsecond line\nthird line");
    (await expect(Nostache("first line\r\nsecond line\r\nthird line")())).resolves.toBe("first line\nsecond line\nthird line");
    (await expect(Nostache(`first line
second line
third line`)())).resolves.toBe("first line\nsecond line\nthird line");
});

test("HTML Tags", async () => {
    (await expect(Nostache("<p>simple text</p>")())).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<p><b>simple</b> text</p>")())).resolves.toBe("<p><b>simple</b> text</p>");
});

test("HTML in logic block", async () => {
    (await expect(Nostache("<{ <p>simple text</p> }>")())).resolves.toBe("<p>simple text</p>");
    expect(Nostache(`<{
    <p>simple text</p>
    }>`)()).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<{ <p><b>simple</b> text</p> }>")())).resolves.toBe("<p><b>simple</b> text</p>");
    (await expect(Nostache("<{ if (true) {<p>simple text</p>} }>")())).resolves.toBe("<p>simple text</p>");
    expect(Nostache(`<{ if (true) {
    <p>simple text</p>
    } }>`)()).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<{ if (true) {<p><b>simple</b> text</p>} }>")())).resolves.toBe("<p><b>simple</b> text</p>");
    (await expect(Nostache("<{ if (true) }><p>simple text</p><;>")())).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<{ if (false) {<p>error</p>} else {<p>simple text</p>} }>")())).resolves.toBe("<p>simple text</p>");
    expect(Nostache(`<{ if (false) {
    <p>error</p>
    } else {
    <p>simple text</p>
    } }>`)()).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<{ let i = 0; while (i === 0) {i++; { <p>simple text</p> }}}>")())).resolves.toBe("<p>simple text</p>");
    expect(Nostache(`<{ let i = 0; while (i === 0) {i++; {
    <p>simple text</p>
    }} }>`)()).resolves.toBe("<p>simple text</p>");
});

test("Mixed blocks", async () => {
    (await expect(Nostache("<p><{ if (true) { <b>simple text</b> }}></p>")())).resolves.toBe("<p><b>simple text</b></p>");
    (await expect(Nostache("<p><{ if (true) }>simple text<;></p>")())).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("<p><{ if (true) {}>simple text<{}}></p>")())).resolves.toBe("<p>simple text</p>");
    (await expect(Nostache("one<{ if (true) }>simple text<;>two")())).resolves.toBe("onesimple texttwo");
    (await expect(Nostache("one<{ if (true) }> simple text <;>two")())).resolves.toBe("one simple text two");
});

test("Nested blocks", async () => {
    (await expect(Nostache("<{ if (true) { <p><{ if (true) { <b>simple text</b> }}></p> }}>")())).resolves.toBe("<p><b>simple text</b></p>");
    (await expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")())).resolves.toBe("<p><b><i>simple</i> text</b></p>");
    (await expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) {<i>simple</i>}}> text</b> }}></p> }}>")())).resolves.toBe("<p><b><i>simple</i> text</b></p>");
    (await expect(Nostache("<{ if (true) { <p><{ if (true) { <b><{ if (true) }><i>simple</i><;> text</b> }}></p> }}>")())).resolves.toBe("<p><b><i>simple</i> text</b></p>");
});

test("Whitespace", async () => {
    (await expect(Nostache(" <{ }> ")())).resolves.toBe("  ");
    (await expect(Nostache(" <{ <p>simple text</p> }> ")())).resolves.toBe(" <p>simple text</p> ");
    (await expect(Nostache(" <{ if (true) { <p>simple text</p> } }> ")())).resolves.toBe(" <p>simple text</p> ");
    (await expect(Nostache(" <{ if (true) }> <p>simple text</p> <;> ")())).resolves.toBe("  <p>simple text</p>  ");
    (await expect(Nostache("<div> <{ if (true) { <p>simple text</p> } }> </div>")())).resolves.toBe("<div> <p>simple text</p> </div>");
    (await expect(Nostache(" <div> <{ if (true) { <p>simple text</p> } }> </div> ")())).resolves.toBe(" <div> <p>simple text</p> </div> ");
    (await expect(Nostache(" <{ if (true) { <div> <{ if (true) { <p>simple text</p> }}> </div> }}> ")())).resolves.toBe(" <div> <p>simple text</p> </div> ");
});

test("Escape", async () => {
    (await expect(Nostache(`<p>"'\\"'\\<{ if (true) { <b>simple"'\\"'\\text</b> }}>\\'"\\'"</p>`)())).resolves.toBe(`<p>"'\\"'\\<b>simple"'\\"'\\text</b>\\'"\\'"</p>`);
    (await expect(Nostache(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`)())).resolves.toBe(`\\'\\'''\\\\\\'aaa\\'\\''  '\\  \\  \\'`);
    (await expect(Nostache("<<{")())).resolves.toBe("<{");
    (await expect(Nostache("<<<{")())).resolves.toBe("<<{");
    (await expect(Nostache(" <<{ ")())).resolves.toBe(" <{ ");
    (await expect(Nostache("test<<{test")())).resolves.toBe("test<{test");
    (await expect(Nostache("<p><<{</p>")())).resolves.toBe("<p><{</p>");
    (await expect(Nostache("<p> <<{ </p>")())).resolves.toBe("<p> <{ </p>");
    (await expect(Nostache("test <<{ test")())).resolves.toBe("test <{ test");
    (await expect(Nostache("=={")())).resolves.toBe("={");
    (await expect(Nostache("==={")())).resolves.toBe("=={");
    (await expect(Nostache(" =={ ")())).resolves.toBe(" ={ ");
    (await expect(Nostache("test=={test")())).resolves.toBe("test={test");
    (await expect(Nostache("<p>=={</p>")())).resolves.toBe("<p>={</p>");
    (await expect(Nostache("<p> =={ </p>")())).resolves.toBe("<p> ={ </p>");
    (await expect(Nostache("test =={ test")())).resolves.toBe("test ={ test");
    (await expect(Nostache("<<{}>")())).resolves.toBe("<{}>");
    (await expect(Nostache(" <<{ }>")())).resolves.toBe(" <{ }>");
    (await expect(Nostache("test<<{test}>")())).resolves.toBe("test<{test}>");
    (await expect(Nostache("<p><<{</p>}>")())).resolves.toBe("<p><{</p>}>");
    (await expect(Nostache("<p> <<{ </p>}>")())).resolves.toBe("<p> <{ </p>}>");
    (await expect(Nostache("test <<{ test}>")())).resolves.toBe("test <{ test}>");
    (await expect(Nostache("=={}>")())).resolves.toBe("={}>");
    (await expect(Nostache(" =={ }>")())).resolves.toBe(" ={ }>");
    (await expect(Nostache("test=={test}>")())).resolves.toBe("test={test}>");
    (await expect(Nostache("<p>=={</p>}>")())).resolves.toBe("<p>={</p>}>");
    (await expect(Nostache("<p> =={ </p>}>")())).resolves.toBe("<p> ={ </p>}>");
    (await expect(Nostache("test =={ test}>")())).resolves.toBe("test ={ test}>");
});

test("Output expressions", async () => {
    (await expect(Nostache("={ 10 }>")())).resolves.toBe("10");
    (await expect(Nostache("={ 5 + 5 }>")())).resolves.toBe("10");
    (await expect(Nostache("={ 'aa' }>")())).resolves.toBe("aa");
    (await expect(Nostache("={ {a:'aa'}.a }>")())).resolves.toBe("aa");
    (await expect(Nostache("={ (()=> 'aa')() }>")())).resolves.toBe("aa");
    (await expect(Nostache("={ 10 }> ={ 'aa' }>")())).resolves.toBe("10 aa");
    (await expect(Nostache("<p>={ 10 }></p>")())).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<p>={ 5 + 5 }></p>")())).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<p>={ 'aa' }></p>")())).resolves.toBe("<p>aa</p>");
    (await expect(Nostache("<p>={ {a:'aa'}.a }></p>")())).resolves.toBe("<p>aa</p>");
    (await expect(Nostache("<p>={ (() => 'aa')() }></p>")())).resolves.toBe("<p>aa</p>");
    (await expect(Nostache("<p>={ 10 }></p>={ 'aa' }>")())).resolves.toBe("<p>10</p>aa");
    (await expect(Nostache("<{ if (true) {<p>={ 10 }></p>}}>")())).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<{ if (true) {<p>={ 5 + 5 }></p>}}>")())).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<{ if (true) {<p>={ 5 + 5 }></p>={'aa'}>}}>")())).resolves.toBe("<p>10</p>aa");
});

test("This argument", async () => {
    (await expect(Nostache("={ this }>")(10))).resolves.toBe("10");
    (await expect(Nostache("={ this }>")(true))).resolves.toBe("true");
    (await expect(Nostache("={ this }>")(""))).resolves.toBe("");
    (await expect(Nostache("={ this.a }>")({a: 'aa'}))).resolves.toBe("aa");
    (await expect(Nostache("<p>={ this }></p>")(10))).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<p>={ this }></p>")(true))).resolves.toBe("<p>true</p>");
    (await expect(Nostache("<p>={ this }></p>")(""))).resolves.toBe("<p></p>");
    (await expect(Nostache("<p>={ this.a }></p>")({a: 'aa'}))).resolves.toBe("<p>aa</p>");
    (await expect(Nostache("<{if (true) {<p>={ this }></p>} }>")(10))).resolves.toBe("<p>10</p>");
    (await expect(Nostache("<{if (true) {<p>={ this }></p>} }>")(true))).resolves.toBe("<p>true</p>");
    (await expect(Nostache("<{if (true) {<p>={ this }></p>} }>")(""))).resolves.toBe("<p></p>");
    (await expect(Nostache("<{if (true) {<p>={ this.a }></p>} }>")({a: 'aa'}))).resolves.toBe("<p>aa</p>");
});

test("Arguments", async () => {
    (await expect(Nostache("={ a }>")({a: 'bb'}))).resolves.toBe("bb");
    (await expect(Nostache("={ A }>")({A: 'bb'}))).resolves.toBe("bb");
    (await expect(Nostache("={ _a }>")({_a: 'bb'}))).resolves.toBe("bb");
    (await expect(Nostache("<p>={ a }></p>")({a: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<p>={ A }></p>")({A: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<p>={ _a }></p>")({_a: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (true) {<p>={ a }></p>} }>")({a: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (true) {<p>={ A }></p>} }>")({A: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (true) {<p>={ _a }></p>} }>")({_a: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (a) {<p>={ b }></p>} }>")({a: true, b: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (!a) {<p>={ b }></p>} }>")({a: false, b: 'bb'}))).resolves.toBe("<p>bb</p>");
    (await expect(Nostache("<{if (!a) {<p>={ b }></p>} }>")({a: true, b: 'bb'}))).resolves.toBe("");
    (await expect(Nostache("<{if (a) {<p>={ b }></p>} }>")({a: false, b: 'bb'}))).resolves.toBe("");
    (await expect(Nostache("={a}> ={b}>")({a: 'aa', b: 'bb'}))).resolves.toBe("aa bb");
    (await expect(Nostache("={a}> ={b.c}>")({a: 'aa', b: {c: 'bb'}}))).resolves.toBe("aa bb");
    await (expect(Nostache("={ c }>")({a: 'aa', b: 'bb'}))).rejects.toBeInstanceOf(ReferenceError);
    await (expect(async () => {
        const t = Nostache("={ a }>");
        t.contextDecomposition = false;
        await t({a: "aa"});
    })).rejects.toBeInstanceOf(ReferenceError);
    (await expect(Nostache("={a}> ={b}>")(Object.create({a: 'aa', b: 'bb'})))).resolves.toBe("aa bb");
});

test("Arguments Mutation", async () => {
    (await expect(Nostache("={ a++ }><p>={ a }></p>")({a: 0}))).resolves.toBe("0<p>1</p>");
    (await expect(Nostache("={ ++a }><p>={ a }></p>")({a: 0}))).resolves.toBe("1<p>1</p>");
    (await expect(Nostache("={ a = 'bb'; }><p>={ a }></p>")({a: 'aa'}))).resolves.toBe("bb<p>bb</p>");
    (await expect(Nostache("={ a }><{ a = 'bb'; }><p>={ a }></p>")({a: 'aa'}))).resolves.toBe("aa<p>bb</p>");
    (await expect(Nostache("={ this.a++ }><p>={ this.a }></p>")({a: 0}))).resolves.toBe("0<p>1</p>");
    (await expect(Nostache("={ ++this.a }><p>={ this.a }></p>")({a: 0}))).resolves.toBe("1<p>1</p>");
    (await expect(Nostache("={ this.a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'}))).resolves.toBe("bb<p>bb</p>");
    (await expect(Nostache("={ this.a }><{ this.a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'}))).resolves.toBe("aa<p>bb</p>");
    (await expect(Nostache("={ this.a++ }><p>={ a }></p>")({a: 0}))).resolves.toBe("0<p>0</p>");
    (await expect(Nostache("={ ++this.a }><p>={ a }></p>")({a: 0}))).resolves.toBe("1<p>0</p>");
    (await expect(Nostache("={ this.a = 'bb'; }><p>={ a }></p>")({a: 'aa'}))).resolves.toBe("bb<p>aa</p>");
    (await expect(Nostache("={ this.a }><{ this.a = 'bb'; }><p>={ a }></p>")({a: 'aa'}))).resolves.toBe("aa<p>aa</p>");
    (await expect(Nostache("={ a++ }><p>={ this.a }></p>")({a: 0}))).resolves.toBe("0<p>0</p>");
    (await expect(Nostache("={ ++a }><p>={ this.a }></p>")({a: 0}))).resolves.toBe("1<p>0</p>");
    (await expect(Nostache("={ a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'}))).resolves.toBe("bb<p>aa</p>");
    (await expect(Nostache("={ a }><{ a = 'bb'; }><p>={ this.a }></p>")({a: 'aa'}))).resolves.toBe("aa<p>aa</p>");
});