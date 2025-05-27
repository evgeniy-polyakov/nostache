# <{ Nostache }>

Embedded JavaScript templates with minimalistic syntax.

## Features

* Full JavaScript support, no fancy invented language.
* Minimum of flow control characters, easy to learn and use syntax.
* Straightforward whitespace control rules made for the most common cases.
* Minimum options, override things only when you really need it.
* Fast template parsing - only one iteration over the string, no regular expressions.
* Two-level cache of templates: imported and parsed templates.
* Unnamed template parameters, you're not bound to their names in the calling code.
* No hidden variables that could conflict with your template data.
* Built-in support of promises, an option to use async/await syntax.
* Small size - less than 6kB minified.
* Flow control characters are ignored in JS comments and strings.
* Support of inner templates - reusable functions with the same syntax as the template itself.

## Use

Import `Nostache` function and call it with a string defining the template. Then call the template with desired parameters.

```javascript
const Nostache = require("nostache.min.js");
// Define a template.
// No parsing at this line, the template is analysed and put to cache on the first render.
const listTemplate = Nostache(`{@ numberOfItems @}
<ul><{ 
    for (let i = 0; i < numberOfItems; i++) {
        <li>Item #{= i + 1 =}</li>
    }
}></ul>`);
// Render the temaplte into an html string
const listHtml = await listTemplate(3);
console.log(listHtml);
```

Output:

```html

<ul>
    <li>Item #1</li>
    <li>Item #2</li>
    <li>Item #3</li>
</ul>
```

## Syntax Cheatsheet

| Block                                   | Type                | Description                                                              | Parent Block         |
|-----------------------------------------|---------------------|--------------------------------------------------------------------------|----------------------|
| Logic `<{ }>`                           | JS Statement        | JS code to breathe life into your template                               | Text                 |
| Html tag `{< >}`                        | Text                | Plain html tag inside JS code                                            | `<{ }>`              |
| String `{> <}`                          | Text                | Plain string inside JS code                                              | `<{ }>`              |
| Output `{= =}`                          | JS Expression       | Outputs the html-escaped result of the inner JS expression               | Text or JS Statement |
| Unsafe `{~ ~}`                          | JS Expression       | Outputs the result of the inner JS expression as is                      | Text or JS Statement |
| Parameters<br/>`{@ a, b, c @}`          | JS Statement        | Declares the list of template parameters, destructing is supported       | Text or JS Statement |
| Import template<br/>`{@ name "file" @}` | JS Statement        | Declares a template to import as a function with optional `name`         | Text or JS Statement |
| Inner template<br/>`{@ name () body @}` | JS Statement + Text | Declares an inner template as a function with optional `name` and `body` | Text or JS Statement |

## Template Logic

Put your template logic in a `<{ }>` block. It's like an html tag but with code inside, as simple as that. Empty block terminates JS statement.

```javascript
Nostache(`<p><{ for (let i = 0; i < 3; i++) }><br><{}></p>`)();
// `<p><br><br><br></p>`
```

In most cases it's better to use simplified syntax that allows html tags right inside the code. Any html tag wrapped in braces `{< >}` is considered as such. Whitespace and comments around the tag
are ignored.

```javascript
Nostache(`<p><{ for (let i = 0; i < 3; i++) { <br> } }></p>`)();
// `<p><br><br><br></p>`
```

If you want to output plain string instead of a tag, use `{> <}` block. The string goes as is, no html escape. Whitespace and comments around the string are preserved.

```javascript
Nostache(`<p><{ for (let i = 0; i < 3; i++) {> Br<} }> </p>`)()
// `<p> Br Br Br </p>`
```

## Safe and Unsafe

Use `{= =}` for html-escaped output and `{~ ~}` for unescaped one.

```javascript
Nostache(`<p>{= "Safe & Unsafe" =}</p>`)() // `<p>Safe &#38;#38; Unsafe</p>`
Nostache(`<p>{~ "Safe & Unsafe" ~}</p>`)() // `<p>Safe & Unsafe</p>`
```

If you plan to use the engine to generate some code other than html you can override the escape function.

```javascript
// Escape JSON quotes
Nostache(`{"quote": "{= '"' =}"}`, {
    escape: text => text.replace(/"/, '\\"')
})()
// `{"quote": "\""}`
```

## Template Parameters

Many template engines use named parameters to pass data to templates. It creates unnecessary dependency, i.e. if we want to rename a parameter inside a template we also have to rename it everywhere
the template is called. Nostache in the opposite considers templates as functions with ordered but not named parameters. Use `{@ @}` to extract template parameters into variables that can be used
later in the code. Comments are allowed inside the block. Whitespace after the block is trimmed.

```javascript
Nostache(`{@ /* Meet template parameters! */ a, b @}
<p>{= a =} {= b =}</p>`)(1, 2)
// `<p>1 2</p>`
```

## Strings and Comments

Strings and comments are analyzed in JS code blocks and all flow control characters are ignored there. That's why the engine has no comment block or an escape symbol. Just use JS comments and strings
for that.

```javascript
Nostache(`{~ "<{{={~{@ @}~}=}}>" ~}`)() // `<{{={~{@ @}~}=}}>`
Nostache(`<{let s = "<{{={~{@ @}~}=}}>"; }>{~ s ~}`)() // `<{{={~{@ @}~}=}}>`
Nostache(`{~ /* <{{={~{@ @}~}=}}> */ ~}`)() // ``
Nostache(`{~ // <{{={~{@ @}~}=}}>
~}`)() // ``
```

## Whitespace Control

The engine has simple rules for whitespace control:

* Whitespace around logic `<{ }>` and output `{= =}` `{~ ~}` blocks is preserved
* Whitespace before declaration `{@ @}` blocks is preserved and trimmed after them
* Whitespace around any blocks inside `<{ }>` is trimmed
* Extra whitespace is generated by empty output `{= =}` `{~ ~}` blocks

```javascript
Nostache(`<p>{~  ~}</p>`)() // `<p>  </p>`
Nostache(`<p>{~
~}</p>`)() /* `<p>
</p>` */
```

## Mighty `this`

`this` variable inside the template code contains all the template data:

* Indexed arguments

```javascript
Nostache(`<p>{= this[0] =} {= this[1] =}</p>`)(1, 2) // `<p>1 2</p>`
```

* It is iterable

```javascript
Nostache(`<{ const [a, b] = this; }><p>{= a =} {= b =}</p>`)(1, 2) // `<p>1 2</p>`
// Shorter form:
Nostache(`{@ a, b @}<p>{= a =} {= b =}</p>`)(1, 2) // `<p>1 2</p>`
```

* It is the reference to the template function itself. That allows recursive templates - the best way to shoot yourself in the foot.

```javascript
Nostache(`<div>{@ i @} {= i =}<{ if (i > 1) {~ this(i - 1) ~} }></div>`)(3)
// `<div>3<div>2<div>1</div></div></div>`
```

* Escape function, can be overridden in options

```javascript
Nostache(`<code>{~ this.escape("<br>") ~}</code>`)() // `<code>&#38;#60;br&#38;#62;</code>`
// Shorter form:
Nostache(`<code>{= "<br>" =}</code>`)() // `<code>&#38;#60;br&#38;#62;</code>`
```

* Import function, can be overridden in options

```javascript
// inner.htm: <p>{= this[0] =}</p>
Nostache(`<div><{ const inner = this.import("inner.htm")
}>{~ inner(1) ~}{~ inner(2) ~}</div>`)() // `<div><p>1</p><p>2</p></div>`
// Shorter form:
Nostache(`<div>{@ inner "inner.htm" @}
{~ inner(1) ~}{~ inner(2) ~}</div>`)() // `<div><p>1</p><p>2</p></div>`
```

* Any extensions you can dream of

```javascript
Nostache(`<p>{= this.myDream() =}</p>`, {
    extensions: {
        myDream: () => "Pineapple Pizza"
    }
})() // <p>Pineapple Pizza</p>
```

## Template Imports

One is never satisfied with just a few independent template files. Sooner or later the need arise to import one template file inside another. Nostache has no problem with that, use `{@ name "file" @}`
block to import a `file` and put it to a template function called `name`. Note that `file` can be any JS expression.

```javascript
// inner.htm: <p>{= this[0] =}</p>
Nostache(`<div>{@ inner "inner.htm" @}
{~ inner(1) ~}{~ inner(2) ~}</div>`)() // `<div><p>1</p><p>2</p></div>`

// Name is optional you can pass the function wherever you like
Nostache(`<div><{ const inner = {@ "inner.htm" @}
}>{~ inner(1) ~}{~ inner(2) ~}</div>`)() // `<div><p>1</p><p>2</p></div>`
```

Under the hood [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) is used in browser environment
and [fs.readFile](https://nodejs.org/docs/latest-v20.x/api/fs.html#fsreadfilepath-options-callback) in Node.js, path to file is relative to the executing script. You can override the import function
to gain more control of what's going on.

```javascript
Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
    import: file => `<b>{= this[0] =}</b>`
})() // `<div><b>1</b><b>2</b></div>`

// In most cases in will be a promise
Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
    import: file => new Promise(r => r(`<b>{= this[0] =}</b>`))
})() // `<div><b>1</b><b>2</b></div>`
```

## Inner Templates

Inner templates is the most powerful feature of Nostache. You can mark some block of code as an inner function and then call it in the template. Use `{@ name () body @}` to define a function called
`name` with `body`. Whitespace after the block and around the function body are ignored. Comments are allowed before the function body.

```javascript
Nostache(`{@ /* Meet inner templates! */ li (i) <li>{= i =}</li> @}
<ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)() /* `<ul>
    <li>1</li>
    <li>2</li>
</ul>` */
// Name is optional, you can pass the function wherever you like
Nostache(`<{ const li = {@ (i) <li>{= i =}</li> @} }><ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)() /* `<ul>
    <li>1</li>
    <li>2</li>
</ul>` */
// `this` is still pointing to the parent template
Nostache(`{@ li (i) <li>{= this[0] =} #{= i =}</li> @}
<ul>
    {~ li(1) ~}
    {~ li(2) ~}
</ul>`)("Item") /* `<ul>
    <li>Item #1</li>
    <li>Item #2</li>
</ul>` */
```

Some evil voodoo magic with nested inner templates:

```javascript
Nostache(`{@ tr (row, columns)
    <tr>{@ td (column) <td>{= row + 1 =} {= column + 1 =}</td> @}
        <{ for (let i = 0; i < columns; i++) {~ td(i) ~} }></tr> @}
<table>
    {~ tr(0, 3) ~}
    {~ tr(1, 3) ~}
    {~ tr(2, 3) ~}
</table>`)() /* `<table>
    <tr><td>1 1</td><td>1 2</td><td>1 3</td></tr>
    <tr><td>2 1</td><td>2 2</td><td>2 3</td></tr>
    <tr><td>3 1</td><td>3 2</td><td>3 3</td></tr>
</table>` */
```

### Early Return

If for some reason at the middle of your template you decide that enough is enough, and you don't want to output all the stuff below then Nostache can give you a hand with that. Just type `return` in
logic block and you're out of the template. The return value is attached at the end of the result.

```javascript
Nostache(`<p><{ if ('stars are aligned') return; }></p>`)() // `<p>`
Nostache(`<p><{ if ('stars are aligned') return 'exit'; }></p>`)() // `<p>exit`
```

### Promises

The engine is very confiding. You can promise anything, and it will be obediently waiting for the outcome before producing the final result. Promises can be used in:

* Output blocks

```javascript
Nostache(`<p>{= new Promise(r => r(1)) =}</p>`)() // `<p>1</p>`
Nostache(`<p>{~ new Promise(r => r(1)) ~}</p>`)() // `<p>1</p>`
```

* Template code itself

```javascript
Nostache(new Promise(r => r("I told {= this[0] =} so!")))("you") // `I told you so!`
```

* Return value of `escape` and `import`

```javascript
Nostache(`<code>{~ this.escape("<br>") ~}</code>`, {
    escape: text => new Promise(r => r(text.toUpperCase()))
})() // `<code><BR></code>`
Nostache(`<div>{~ this.import("inner.htm")(1) ~}</div>`, {
    import: file => new Promise(r => r("<p>{= this[0] =}</p>"))
})() // `<div><p>1</p></div>`
```

* Early return value
```javascript
Nostache(`<p><{ if ('stars are aligned') return new Promise(r => r('exit'); }></p>`)() // `<p>exit`
```

* Extensions

```javascript
Nostache(`<p>{= this.myDream() =}</p>`, {
    extensions: {
        myDream: () => new Promise(r => r("Pineapple Pizza"))
    }
})() // <p>Pineapple Pizza</p>
```

## Cache

Nostache has two-level cache:

* Import cache: template code is stored as string by its url
* Function cache: template function is stored by template code string

Use `cache` variable to access the cache, clear it or even override its functionality:

```javascript
Nostache.cache.clear(); // Clears all cache
Nostache.cache.clear("import"); // Clears import cache
Nostache.cache.clear("function"); // Clears function cache
Nostache.cache.clear("async"); // Clears function cache of templates with `async/await` syntax 
```

## Options

Nostache has just a few options to alter template behaviour. Options defined for a template are automatically inherited by all imported templates.

* `verbose`: `true` | `false` = `false` - verbose templates print the template function code and arguments in the console anytime they are called
* `async`: `true` | `false` = `false` - async templates allow `async/await` syntax in the template code
* `cache`: `true` | `false` | `"import"` | `"function"` = `true` - cache control, whether everything is cached or only imports or only functions
* `escape` - escape function override, takes a string and returns an escaped string or a promise
* `import` - import function override, takes path to a file and return a promise of template code string
* `extensions` - object with template extension variables and functions, they are available as members of `this` in the template code

Global default options can be defiled on Nostache function itself:

```javascript
Nostache.cache.verbose = true; // All templates are flooding the console
Nostache.cache.async = true; // All templates can use `async/await`
Nostache.cache.cache = false; // No cache whatsoever, forget about it
Nostache.cache.extensions = {
    ageOfUniverse: 13.8e+9,
    canLickOwnElbow: (person) => "no",
}; // Now everyone knows that
```