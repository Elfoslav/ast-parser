const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const prettier = require('prettier');

if (process.argv.length < 6) {
  console.log('Usage: node script.js basePath outputPath replaceWhat replaceBy');
  process.exit(1);
}

const basePath = process.argv[2];
const outputPath = process.argv[3];
const replaceWhat = process.argv[4];
const replaceBy = process.argv[5];

const getReplaceRegex = (replaceStr) => new RegExp(replaceStr, 'gi');

const generatorOptions = {
  retainLines: true,
  /* other options */
};

// Define a function to rename a string
function renameString(str, replaceWhat, replaceBy) {
  return str.replace(getReplaceRegex(replaceWhat), (match) => {
    // Preserve the original capitalization of the first letter
    const firstCharIsUppercase = match[0] === match[0].toUpperCase();
    const firstLetter = firstCharIsUppercase
      ? replaceBy.charAt(0).toUpperCase()
      : replaceBy.charAt(0);
    return firstLetter + replaceBy.substr(1);
  });
}

function replaceWhatExists(node) {
  return getReplaceRegex(replaceWhat).test(node.name || node.value)
}

// Define a function to rename a node (identifier or string literal)
function renameNode(node, replaceWhat, replaceBy) {
  // Replace specified text with the new text
  if (node.name) {
    node.name = renameString(node.name, replaceWhat, replaceBy);
  } else if (node.value) {
    node.value = renameString(node.value, replaceWhat, replaceBy);
  }
}

// Define a function to rename entities in the AST
async function renameEntitiesInFile(filePath, outputPath) {
  // Read the input TypeScript file
  const code = fs.readFileSync(filePath, 'utf8');

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const changes = [];

  traverse(ast, {
    enter(path) {
      const { node } = path;
      if (path.isIdentifier()) {
        changes.push(replaceWhatExists(node));
        renameNode(node, replaceWhat, replaceBy);
      } else if (path.isStringLiteral()) {
        changes.push(replaceWhatExists(node));
        renameNode(node, replaceWhat, replaceBy);
      }
    },
  });

  if (changes.includes(true)) {
    const updatedCode = generator(ast, generatorOptions).code;
    const formattedCode = await prettier.format(updatedCode, {
      parser: 'typescript',
    });

    const fileName = path.basename(filePath);
    const newFileName = renameString(fileName, replaceWhat, replaceBy);

    fs.writeFileSync(path.join(outputPath, newFileName), formattedCode, 'utf8');

    console.log(`Identifiers and string literals renamed successfully in ${newFileName}!`);
  }
}

fs.readdirSync(basePath).forEach((file) => {
  const filePath = path.join(basePath, file);
  renameEntitiesInFile(filePath, outputPath);
});

console.log('All files processed.');
