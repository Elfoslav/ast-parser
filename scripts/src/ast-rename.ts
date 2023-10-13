import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse, { NodePath, Node } from '@babel/traverse';
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

const getReplaceRegex = (replaceStr: string): RegExp => new RegExp(replaceStr, 'g');

const generatorOptions = {
  retainLines: true,
  /* other options */
};

// Define a function to rename a string
function renameString(str: string, replaceWhat: string, replaceBy: string): string {
  return str.replace(getReplaceRegex(replaceWhat), (match) => {
    // Preserve the original capitalization of the first letter
    const firstCharIsUppercase = match[0] === match[0].toUpperCase();

    if (firstCharIsUppercase) {
      return replaceBy;
    }

    const firstLetter = firstCharIsUppercase
      ? replaceBy.charAt(0).toUpperCase()
      : replaceBy.charAt(0);

    return `${firstLetter}${replaceBy.substring(1)}`;
  });
}

function replaceWhatExists(text: string): boolean {
  return getReplaceRegex(replaceWhat).test(text);
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
    StringLiteral(path: NodePath<Node>) {
      const { node } = path;
      if (node.type === 'StringLiteral' && typeof node.value === 'string') {
        changes.push(replaceWhatExists(node.value));
        node.value = renameString(node.value, replaceWhat, replaceBy);
      }
    },
    Identifier(path: NodePath<Node>) {
      const { node } = path;
      if (node.type === 'Identifier' && typeof node.name === 'string') {
        changes.push(replaceWhatExists(node.name));
        node.name = renameString(node.name, replaceWhat, replaceBy);
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
