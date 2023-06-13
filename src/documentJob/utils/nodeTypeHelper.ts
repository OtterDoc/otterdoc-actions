import * as ts from 'typescript'

export function getNodeTypeString(node: ts.Node): string | undefined {
  if (ts.isClassDeclaration(node)) {
    return 'ClassDeclaration'
  } else if (ts.isMethodDeclaration(node)) {
    return 'ClassMethod'
  } else if (ts.isFunctionDeclaration(node)) {
    return 'FunctionDeclaration'
  } else if (ts.isInterfaceDeclaration(node)) {
    return 'InterfaceDeclaration'
  } else if (ts.isTypeAliasDeclaration(node)) {
    return 'TypeAlias'
  } else if (ts.isEnumDeclaration(node)) {
    return 'EnumDeclaration'
  } else if (
    ts.isPropertyDeclaration(node) &&
    node.initializer &&
    ts.isArrowFunction(node.initializer)
  ) {
    return 'ArrowFunctionExpression'
  }
}

export function isNodeExported(node: ts.Node): boolean {
  if (ts.isClassElement(node)) {
    const modifiers = ts.getCombinedModifierFlags(node)
    return !(
      modifiers &
      (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)
    )
  } else if (
    ts.isClassDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node)
  ) {
    return (
      node.modifiers !== undefined &&
      (node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ||
        node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword))
    )
  }
  return false
};

export function getNodeDisplayName(node: ts.Node): string {
  return node.getText().split('\n')[0].trim() || 'Unknown'
};