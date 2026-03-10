const { Editor } = require('@tiptap/core');
const StarterKit = require('@tiptap/starter-kit').default;
const editor = new Editor({
  extensions: [StarterKit],
  parseOptions: { preserveWhitespace: 'full' }
});
console.log(editor.options.parseOptions);
