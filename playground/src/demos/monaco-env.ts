import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
// Vite 5 cannot resolve the JSON worker through Monaco's wildcard exports, so
// point at the ESM file directly. The playground local install is a symlink.
import JsonWorker from '../../node_modules/monaco-editor/esm/vs/language/json/json.worker.js?worker'
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker'

interface MonacoWorkerEnvironment {
  getWorker: (moduleId: string, label: string) => Worker
}

if (typeof self !== 'undefined') {
  ;(self as unknown as { MonacoEnvironment?: MonacoWorkerEnvironment }).MonacoEnvironment = {
    getWorker(_moduleId, label) {
      if (label === 'json') return new JsonWorker()
      if (label === 'typescript' || label === 'javascript') return new TsWorker()
      return new EditorWorker()
    },
  }
}
