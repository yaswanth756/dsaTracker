import { JSDOM } from 'jsdom';

const html = `<div>  Hello   world \t test</div>`;
const dom = new JSDOM(html);
const document = dom.window.document;
const walker = document.createTreeWalker(document.body, dom.window.NodeFilter.SHOW_TEXT);
let node;
while ((node = walker.nextNode())) {
    if (node.nodeValue) {
        node.nodeValue = node.nodeValue
            .replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0')
            .replace(/ {2,}/g, match => '\u00A0'.repeat(match.length));
    }
}
console.log(document.body.innerHTML);
