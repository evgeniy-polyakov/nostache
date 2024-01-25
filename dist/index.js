function charCode(char) {
    if (char.length > 0) {
        const map = {};
        for (let i = 0; i < char.length; i++) {
            map[char.charCodeAt(0)] = true;
        }
        return map;
    }
    return char.charCodeAt(0);
}
const isWhitespace = charCode(" \t\r\n");
const OPEN_ANGLE = charCode("<");
const CLOSE_ANGLE = charCode(">");
const OPEN_BRACE = charCode("{");
const CLOSE_BRACE = charCode("}");
const SEMICOLON = charCode(";");
const EQUAL = charCode("=");
function Nostache(template) {
    let index = 0;
    let startIndex = 0;
    const length = template.length;
    const result = "__var__";
    let funcBody = `let ${result}='';\n`;
    function appendResult() {
        if (index > startIndex) {
            funcBody += `${result}+='${sliceHtml()
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'")}';\n`;
        }
    }
    function appendOutput() {
        if (index > startIndex) {
            funcBody += `${result}+=${sliceCode()};\n`;
        }
    }
    function appendLogic() {
        if (index > startIndex) {
            funcBody += `${sliceCode()}\n`;
        }
    }
    function sliceCode() {
        return template
            .slice(startIndex, index)
            .replace(/^\s+/, "")
            .replace(/\s+$/, "");
    }
    function sliceHtml() {
        return template
            .slice(startIndex, index)
            .replace(/^\s+</, "<")
            .replace(/>\s+$/, ">");
    }
    function parseOpenBlock(c) {
        if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === OPEN_BRACE) {
            appendResult();
            index += 2;
            parseLogicBlock();
            return true;
        }
        else if (c === EQUAL && template.charCodeAt(index + 1) === OPEN_BRACE) {
            appendResult();
            index += 2;
            parseOutputBlock();
            return true;
        }
        else if (c === OPEN_ANGLE && template.charCodeAt(index + 1) === SEMICOLON && template.charCodeAt(index + 2) === CLOSE_ANGLE) {
            appendResult();
            index++;
            startIndex = index;
            index++;
            appendLogic();
            index++;
            startIndex = index;
            return true;
        }
        return false;
    }
    function parseStart() {
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (parseOpenBlock(c)) ;
            else {
                index++;
            }
        }
        appendResult();
    }
    function parseLogicBlock() {
        startIndex = index;
        let isPotentialHtml = true; // We can start html block right away
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (c === OPEN_BRACE) {
                index++;
                isPotentialHtml = true;
            }
            else if (isPotentialHtml && isWhitespace[c]) {
                index++;
            }
            else if (isPotentialHtml && c === OPEN_ANGLE) {
                isPotentialHtml = false;
                appendLogic();
                parseHtmlBlock();
            }
            else if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                appendLogic();
                index += 2;
                break;
            }
            else {
                index++;
                isPotentialHtml = false;
            }
        }
        startIndex = index;
    }
    function parseHtmlBlock() {
        startIndex = index;
        let isPotentialEnd = false;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (parseOpenBlock(c)) ;
            else if (c === CLOSE_ANGLE) {
                index++;
                isPotentialEnd = true;
            }
            else if (isPotentialEnd && isWhitespace[c]) {
                index++;
            }
            else if (isPotentialEnd && c === CLOSE_BRACE) {
                appendResult();
                break;
            }
            else {
                index++;
                isPotentialEnd = false;
            }
        }
        startIndex = index;
    }
    function parseOutputBlock() {
        startIndex = index;
        let hasMeaningfulSymbol = false;
        for (; index < length;) {
            const c = template.charCodeAt(index);
            if (c === CLOSE_BRACE && template.charCodeAt(index + 1) === CLOSE_ANGLE) {
                if (hasMeaningfulSymbol) {
                    appendOutput();
                }
                index += 2;
                break;
            }
            else if (isWhitespace[c]) {
                index++;
            }
            else {
                index++;
                hasMeaningfulSymbol = true;
            }
        }
        startIndex = index;
    }
    parseStart();
    funcBody += `return ${result};`;
    return (context) => {
        const argNames = [];
        const argValues = [];
        const baseObject = {};
        if (context && typeof context === "object") {
            for (const p in context) {
                if (!(p in baseObject) && /^[_a-z]\w*$/i.test(p)) {
                    argNames.push(p);
                    argValues.push(context[p]);
                }
            }
        }
        try {
            return Function(...argNames, funcBody).apply(context, argValues);
        }
        catch (error) {
            error.message += `\nat function (${argNames.join(", ")}) {\n${funcBody}\n}`;
            throw error;
        }
    };
}export{Nostache};