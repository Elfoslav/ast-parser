import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as prettier from 'prettier';

if (process.argv.length < 6) {
  console.log('Usage: node script.ts basePath outputPath replaceWhat replaceBy');
  process.exit(1);
}

const basePath: string = process.argv[2];
const outputPath: string = process.argv[3];
const replaceWhat: string = process.argv[4];
const replaceBy: string = process.argv[5];

const getReplaceRegex = (replaceStr: string): RegExp => new RegExp(replaceStr, 'gi');

const generatorOptions = {
  retainLines: true,
  /* other options */
};

// Define a function to rename a string
function renameString(str: string, replaceWhat: string, replaceBy: string): string {
  return str.replace(getReplaceRegex(replaceWhat), (match) => {
    // Preserve the original capitalization of the first letter
    const firstCharIsUppercase = match[0] === match[0].toUpperCase();
    const firstLetter = firstCharIsUppercase
      ? replaceBy.charAt(0).toUpperCase()
      : replaceBy.charAt(0);
    return firstLetter + replaceBy.substr(1);
  });
}

function replaceWhatExists(node: any): boolean {
  return getReplaceRegex(replaceWhat).test(node.name || node.value);
}

// Define a function to rename a node (identifier or string literal)
function renameNode(node: any, replaceWhat: string, replaceBy: string): void {
  // Replace specified text with the new text
  if (node.name) {
    node.name = renameString(node.name, replaceWhat, replaceBy);
  } else if (node.value) {
    node.value = renameString(node.value, replaceWhat, replaceBy);
  }
}

// Define a function to rename entities in the AST
async function renameEntitiesInFile(filePath: string, outputPath: string): Promise<void> {
  // Read the input TypeScript file
  const code: string = fs.readFileSync(filePath, 'utf8');

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const changes: boolean[] = [];

  traverse(ast, {
    enter(path: NodePath): void {
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
    const updatedCode = generate(ast, generatorOptions).code;
    const formattedCode: string = await prettier.format(updatedCode, {
      parser: 'typescript',
    });

    const fileName: string = path.basename(filePath);
    const newFileName: string = renameString(fileName, replaceWhat, replaceBy);

    fs.writeFileSync(path.join(outputPath, newFileName), formattedCode, 'utf8');

    console.log(`Identifiers and string literals renamed successfully in ${newFileName}!`);
  }
}

fs.readdirSync(basePath).forEach((file: string) => {
  const filePath: string = path.join(basePath, file);
  renameEntitiesInFile(filePath, outputPath);
});

console.log('All files processed.');
