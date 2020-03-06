const { parse } = require('espree');
const walkes = require('walkes');
const esgraph = require('../');

module.exports = generateDotCode;

function generateDotCode(data) {
	let source = data;
  // filter out hashbangs
  if (source.startsWith('#!')) {
    source = `//${source.substring(2)}`;
  }

  var results = []

  try {
    const fullAst = parse(source, { range: true });
    const functions = findFunctions(fullAst);

    results.push('digraph cfg {');
    results.push('node [shape="box"]');
    const options = { counter: 0, source };
    functions.concat(fullAst).forEach((ast, i) => {
      let cfg;
      let label = '[[main]]';
      if (ast.type.includes('Function')) {
        cfg = esgraph(ast.body);
        const name = (ast.id && ast.id.name) || '';
        const params = ast.params.map(p => p.name);
        label = `function ${name}(${params})`;
      } else {
        cfg = esgraph(ast);
      }

      results.push(`subgraph cluster_${i}{`);
      results.push(`label = "${label}"`);
      results.push(esgraph.dot(cfg, options));
      results.push('}');
    });
    results.push('}');
  } catch (e) {
    console.log(e.message);
  }

  return results.join('\n')
}

function findFunctions(ast) {
    const functions = [];
    function handleFunction(node, recurse) {
      functions.push(node);
      recurse(node.body);
    }
    walkes(ast, {
      FunctionDeclaration: handleFunction,
      FunctionExpression: handleFunction,
    });
    return functions;
  }