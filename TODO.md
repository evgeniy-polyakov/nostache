- [ ] **v2.0.0**: Replace import and template declarations with `@import` and `@function`:
```
{@import name ("file.html") @}
{@function name (a,b)
<a>{= a =}</a>
<b>{= b =}</b>
@}

<{ const name = @import("file.html"); }>
<{ const name = {@import("file.html") @}; }>
<{ const name = {@function (a,b)
<a>{= a =}</a>
<b>{= b =}</b>
@}; }>

{~ @import("file.html") ~}
{~ @import("file.html")(1,2) ~}
{~ {@import("file.html") @} ~}
{~ {@import("file.html") @}(1,2) ~}
{~ {@function (a,b) {
<a>{= a =}</a>
<b>{= b =}</b>
@}(1,2) ~}
```
- [ ] **v2.1.0**: Shortcut `@\w+` for `this\.\w+`. Shortcut `@` for `this`.