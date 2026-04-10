import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { markdown } from '@codemirror/lang-markdown';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput,
} from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';

// Crea un editor CodeMirror 6 mínimo. Devuelve { view, getValue, setValue }.
export function createEditor(host, { lang = 'python', initial = '', readOnly = false } = {}) {
  const langExt = lang === 'markdown' ? markdown() : python();

  const extensions = [
    lineNumbers(),
    highlightActiveLine(),
    history(),
    bracketMatching(),
    closeBrackets(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      indentWithTab,
    ]),
    langExt,
    EditorView.lineWrapping,
  ];

  if (readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  const state = EditorState.create({
    doc: initial,
    extensions,
  });

  const view = new EditorView({ state, parent: host });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
      });
    },
    destroy: () => view.destroy(),
  };
}
