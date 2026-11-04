import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Load the actual handler with explicit dependency doubles; never import the remote SDK.
export function loadBackendHandler(url, dependencies) {
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
  source = source.replace('export default', 'return');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
  return new Function(...names, code)(...names.map(name => dependencies[name] ?? (() => { throw new Error('Unexpected dependency: ' + name); })));
}
