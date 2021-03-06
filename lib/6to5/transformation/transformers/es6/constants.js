"use strict";

var t = require("../../../types");

exports.check = function (node) {
  return t.isVariableDeclaration(node, { kind: "const" });
};

var visitor = {
  enter: function (node, parent, scope, context, state) {
    if (t.isAssignmentExpression(node) || t.isUpdateExpression(node)) {
      var ids = t.getBindingIdentifiers(node);

      for (var key in ids) {
        var id = ids[key];

        var constant = state.constants[key];

        // no constant exists
        if (!constant) continue;

        // check if the assignment id matches the constant declaration id
        // if it does then it was the id used to initially declare the
        // constant so we can just ignore it
        if (id === constant) continue;

        var localBinding = scope.getBinding(key);
        if (localBinding !== constant) continue;

        throw state.file.errorWithNode(id, key + " is read-only");
      }
    } else if (t.isScope(node)) {
      context.skip();
    }
  }
};

exports.Scope = function (node, parent, scope, context, file) {
  scope.traverse(node, visitor, {
    constants: scope.getAllDeclarationsOfKind("const"),
    file:      file
  });
};

exports.VariableDeclaration = function (node) {
  if (node.kind === "const") node.kind = "let";
};
