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
* Two-level caching of templates: after loading and after parsing.
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
const listHtml = listTemplate(3);
console.log(listHtml);
```
Output:
```html
<ul><li>Item #1</li><li>Item #2</li><li>Item #3</li></ul>
```

## Blocks
| Block                                | Description                                                        | Whitespace Control                                             | Parent Block                                     | Empty Block        |
|--------------------------------------|--------------------------------------------------------------------|----------------------------------------------------------------|--------------------------------------------------|--------------------|
| Logic `<{ }>`                        | JS code to breathe life into your template                         | &check; Keeps whitespace before and after the block            | Root, `{< >}`, `{> <}`, `{@ () @}`               | Ignored            |
| Html `{< >}`                         | Plain html tag inside JS code                                      | &cross; Trims whitespace before and after the tag              | `<{ }>`                                          | Invalid html       |
| Text `{> <}`                         | Plain text inside JS code                                          | &cross; Trims whitespace before and after the text             | `<{ }>`                                          | Ignored            |
| Output `{= =}`                       | Outputs the html-escaped result of the inner JS expression         | &check; Keeps whitespace before and after the block            | Root, `<{ }>`, `{< >}`, `{> <}`, `{@ name () @}` | Outputs whitespace |
| Unsafe output `{~ ~}`                | Outputs the result of the inner JS expression as is                | &check; Keeps whitespace before and after the block            | Root, `<{ }>`, `{< >}`, `{> <}`, `{@ name () @}` | Outputs whitespace |
| Parameters `{@ arg1, arg2 @}`        | Declares the list of template parameters, destructing is supported | &check; &cross; Keeps whitespace before, trims after the block | Root, `<{ }>`, `{< >}`, `{> <}`, `{@ name () @}` | Ignored            |
| Template `{@ name "path/to/file" @}` | Declares a template to load as a function with optional `name`     | &check; &cross; Keeps whitespace before, trims after the block | Root, `<{ }>`, `{< >}`, `{> <}`, `{@ name () @}` | Ignored            |
| Inner template `{@ name () @}`       | Declares an inner template as a function with optional `name`      | &check; &cross; Keeps whitespace before, trims after the block | Root, `<{ }>`, `{< >}`, `{> <}`, `{@ name () @}` | Ignored            |