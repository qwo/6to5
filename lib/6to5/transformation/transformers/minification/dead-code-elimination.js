var t = require("../../../types");

exports.optional = true;

exports.ExpressionStatement = function (node, parent, scope, context) {
  // remove consequenceless expressions such as local variables and literals
  //
  //   var foo = true; foo; -> var foo = true;
  //   "foo"; ->
  //

  var expr = node.expression;
  if (t.isLiteral(expr) || (t.isIdentifier(node) && t.hasBinding(node.name))) {
    context.remove();
  }
};

exports.IfStatement = {
  exit: function (node, parent, scope, context) {
    // todo: in scenarios where we can just return the consequent or
    // alternate we should drop the block statement if it contains no
    // block scoped variables

    var consequent = node.consequent;
    var alternate  = node.alternate;
    var test       = node.test;

    // we can check if a test will be truthy 100% and if so we can inline
    // the consequent and completely ignore the alternate
    //
    //   if (true) { foo; } -> { foo; }
    //   if ("foo") { foo; } -> { foo; }
    //

    if (t.isLiteral(test) && test.value) {
      return alternate;
    }

    // we can check if a test will be falsy 100% and if so we can inline
    // the alternate if there is one and completely remove the consequent
    //
    //   if ("") { bar; } else { foo; } -> { foo; }
    //   if ("") { bar; } ->
    //

    if (t.isFalsyExpression(test)) {
      if (alternate) {
        return alternate;
      } else {
        return context.remove();
      }
    }

    // remove alternate blocks that are empty
    //
    //   if (foo) { foo; } else {} -> if (foo) { foo; }
    //

    if (t.isBlockStatement(alternate) && !alternate.body.length) {
      alternate = node.alternate = null;
    }

    // turn alternate blocks into a consequent and flip the test if the
    // consequent block is empty
    //
    //   if (foo) {} else { bar; }
    //   if (!foo) { bar; }
    //

    if (t.blockStatement(consequent) && !consequent.body.length &&
        t.isBlockStatement(alternate) && alternate.body.length) {
      node.consequent = node.alternate;
      node.alternate  = null;
      node.test       = t.unaryExpression("!", test, true);
    }
  }
};
