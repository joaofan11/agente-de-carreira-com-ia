import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Load the actual handler with explicit dependency doubles; never import the remote SDK.
export function loadSourceModule(url, dependencies, exportName = null) {
  let source = readFileSync(url, 'utf8');
  const ast = ts.createSourceFile(String(url), source, ts.ScriptTarget.Latest, true);
  const imports = ast.statements.filter(ts.isImportDeclaration);
  const names = [];
  for (const node of imports) {
    const clause = node.importClause;
    if (clause?.name) names.push(clause.name.text);
    for (const item of clause?.namedBindings?.elements || []) names.push(item.name.text);
  }
  for (const node of [...imports].reverse()) source = source.slice(0, node.getFullStart()) + source.slice(node.getEnd());
  // Finish module initialization before exposing the default export (schemas may follow it).
  source = source.replace('export default', 'const __defaultExport =');
  if(exportName)source=source.replace(/export (async )?function /g,(_,a)=>(a||'')+'function ').replace(/export const /g,'const ');
  source += '\nreturn '+(exportName || '__defaultExport')+';';
  if (dependencies.React && !names.includes('React')) names.push('React');
  const code = ts.transpileModule(source, { fileName: String(url), compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText;
  return new Function(...names, code)(...names.map(name => dependencies[name] ?? (() => { throw new Error('Unexpected dependency: ' + name); })));
}

export const loadBackendHandler = loadSourceModule;
