import * as ts from 'typescript'

/**
 * Returns a string indicating the type of the provided TypeScript node.
 * @param {ts.Node} node - The TypeScript node to determine the type of.
 * @returns {string | undefined} - A string indicating the type of the provided node, or undefined if the node is not a recognized type.
 */
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

/**
 * Determines whether a given TypeScript node is exported or not.
 * @param {ts.Node} node - The TypeScript node to check.
 * @returns {boolean} - Returns true if the node is exported, false otherwise.
 */
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

/**
 * Returns the display name of a TypeScript node.
 * @param {ts.Node} node - The TypeScript node to get the display name of.
 * @returns {string} The display name of the node.
 */
export function getNodeDisplayName(node: ts.Node): string {
  return node.getText().split('\n')[0].trim() || 'Unknown'
};