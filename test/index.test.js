const Nostache = require("../dist/index").Nostache;

test("Simple text", () => {
    expect(Nostache("simple text")()).toBe("simple text");
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
    expect(Nostache("<{ if (true) }> <p>simple text</p> <;>")()).toBe("<p>simple text</p>");
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
    expect(Nostache("<{ if (true) { <p> <{ if (true) { <b>simple text</b> }}> </p> }}>")()).toBe("<p><b>simple text</b></p>");
    expect(Nostache("<{ if (true) { <p> <{ if (true) { <b> <{ if (true) {<i>simple</i>}}> text</b> }}> </p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(Nostache("<{ if (true) { <p> <{ if (true) { <b> <{ if (true) {<i>simple</i>}}> text</b> }}> </p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
    expect(Nostache("<{ if (true) { <p> <{ if (true) { <b> <{ if (true) }><i>simple</i><;> text</b> }}> </p> }}>")()).toBe("<p><b><i>simple</i> text</b></p>");
});

test("Javascript strings escaped", () => {
    expect(Nostache(`<p>"'\\"'\\<{ if (true) { <b>simple"'\\"'\\text</b> }}>\\'"\\'"</p>`)()).toBe(`<p>"'\\"'\\<b>simple"'\\"'\\text</b>\\'"\\'"</p>`);
});