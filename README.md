# <{ Nostache }>
Embedded JavaScript templates with minimalistic syntax.

## Why another JS template engine?
* Why not?
* Wanted something easy to use with as less as possible boilerplate code.
* Need to focus on the template itself rather than learning the template language. 
* Wanted no more than two flow control characters in a row, anything more is annoying.
* Need full support of JavaScript, it's always more powerful compared to any invented domain-specific language.
* Wanted easy way to include other template files and define inner templates.

## Features
* Full JavaScript support, no fancy invented language.
* Minimum of flow control characters, easy to learn and use syntax. 
* Easy whitespace control rules made for the most common cases. 
* Minimum options, override things only when you really need it.
* Fast template parsing - only one iteration over the string, no regular expressions.
* Two-level cache of templates: after loading and after parsing.
* Unnamed template parameters, you're not bound to their names in the calling code.
* No hidden variables that could conflict with your template data.
* Built-in support of promises, an option to use async/await syntax.
* Small size - less than 6kB minified.
* Flow control characters are ignored in JS comments and strings.  

## Use
Import `Nostache` function and call it with a string (or promise of string) defining the template. Then call the template with desired parameters.
```javascript
const Nostache = require('nostache.min.js');
// Define a template. No parsing at this line, the template is analysed and put to cache on the first render
const listTemplate = Nostache(`{@ numberOfItems /* the list of template parameters */ @}
<ul><{ // Inside <{ }> is plain JS 
    for (let i = 0; i < numberOfItems; i++) {
        // JS code supports html in any braces {}   
        <li>Item #{= i + 1 =}</li> // {= =} is html-escaped output
    }
}></ul>`);
// Render the temaplte into an html string
const listHtml = await listTemplate(3);
console.log(listHtml);
```
Output:
```html
<ul><li>Item #1</li><li>Item #2</li><li>Item #3</li></ul>
```

## Syntax Cheatsheet
| Block                                     | Type                | Description                                                                   | Whitespace Control                                                                                          | Parent Block         | Empty Block        |
|-------------------------------------------|---------------------|-------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|----------------------|--------------------|
| Logic `<{ }>`                             | JS Statement        | JS code to breathe life into your template                                    | &check; Keeps whitespace before and after the block                                                         | Text                 | Ignored            |
| Html `{< >}`                              | Text                | Plain html tag inside JS code                                                 | &cross; Trims whitespace before and after the tag                                                           | `<{ }>`              | Invalid html       |
| String `{> <}`                            | Text                | Plain string inside JS code                                                   | &cross; Trims whitespace before and after the string                                                        | `<{ }>`              | Ignored            |
| Output `{= =}`                            | JS Expression       | Outputs the html-escaped result of the inner JS expression                    | &check; Keeps whitespace before and after the block                                                         | Text or JS Statement | Outputs whitespace |
| Unsafe output `{~ ~}`                     | JS Expression       | Outputs the result of the inner JS expression as is                           | &check; Keeps whitespace before and after the block                                                         | Text or JS Statement | Outputs whitespace |
| Parameters `{@ arg1, arg2 @}`             | JS Statement        | Declares the list of template parameters, destructing is supported            | &check; &cross; Keeps whitespace before, trims after the block                                              | Text or JS Statement | Ignored            |
| Load template `{@ name "path/to/file" @}` | JS Statement        | Declares a template to load as a function with optional `name`                | &check; &cross; Keeps whitespace before, trims after the block                                              | Text or JS Statement | Ignored            |
| Inner template `{@ name () text @}`       | JS Statement + Text | Declares an inner template as a function with optional `name` and `text` body | &check; &cross; Keeps whitespace before, trims after the block, trims whitespace around the function body   | Text or JS Statement | Ignored            |

## Mighty `this`
`this` variable contains all the template data:
* Indexed arguments
```javascript
Nostache(`<p>{= this[0] =} {= this[1] =}</p>`)(1, 2) // produces `<p>1 2</p>`
```
* It is iterable
```javascript
Nostache(`<{ const [a, b] = this; }><p>{= a =} {= b =}</p>`)(1, 2) // produces `<p>1 2</p>`

// Shorter form:
Nostache(`{@ a, b @}<p>{= a =} {= b =}</p>`)(1, 2) // produces `<p>1 2</p>`
```
* It is the reference to the template function itself. That allows recursive templates - the best way to shoot yourself in the foot.
```javascript
Nostache(`<div>{@ i @} {= i =}<{ if (i > 1) {~ this(i - 1) ~} }></div>`)(3) // producses `<div>3<div>2<div>1</div></div></div>`
```
* Escape function, can be overridden in options
```javascript
Nostache(`<code>{~ this.escape("<br>") ~}</code>`)() // produces `<code>&#60;br&#62;</code>` 

// Shorter form:
Nostache(`<code>{= "<br>" =}</code>`)() // produces `<code>&#60;br&#62;</code>`

// Override escape:
Nostache(`<code>{= "<br>" =}</code>`, {
    escape: s => s.toUpperCase()
})() // produces `<code><BR></code>`

// Override escape with promise:
Nostache(`<code>{= "<br>" =}</code>`, {
    escape: s => new Promise(r => r(s.toUpperCase()))
})() // produces `<code><BR></code>`
```
* Load function, can be overridden in options, [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) is used by default. 
```javascript
// inner.htm: <p>{= this[0] =}</p>
Nostache(`<div><{ const inner = this.load("inner.htm") }>{~ inner(1) ~}{~ inner(2) ~}</div>`)() // produces `<div><p>1</p><p>2</p></div>`

// Shorter form
Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`)() // produces `<div><p>1</p><p>2</p></div>`

// Override load
Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
    load: s => `<b>{= this[0] =}</b>`
})() // produces `<div><b>1</b><b>2</b></div>`

// Override load with promise
Nostache(`<div>{@ inner "inner.htm" @}{~ inner(1) ~}{~ inner(2) ~}</div>`, {
    load: s => new Promise(r => r(`<b>{= this[0] =}</b>`))
})() // produces `<div><b>1</b><b>2</b></div>`
```
* Any extensions you can dream of
```javascript
Nostache(`<p>{= this.myDream() =}</p>`, {
    extensions: {
        myDream: () => "Pineapple Pizza"
    }
})() // produces <p>Pineapple Pizza</p>

// Or a promise of your dream that comes true sometime
Nostache(`<p>{= this.myDream() =}</p>`, {
    extensions: {
        myDream: () => new Promise(r => r("Pineapple Pizza"))
    }
})() // produces <p>Pineapple Pizza</p>
```