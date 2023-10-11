# AST parser

## Usage

From root directory run in cmd:

```
node ast-rename.js ./react-app/src/components/ ./react-app/src/replaced-components counter replaced
```

`./react-app/src/components/` is a directory of files which should be traversed.

`./react-app/src/replaced-components` is a directory where changed files should be stored.

`counter` is name of file/function/variable which should be changed/renamed.

`replaced` is a string which will replace `counter`.

## Examples to test:

```
node ast-rename.js ./react-app/src/components/ ./react-app/src/replaced-components counterEntity replaceEntity
```

```
node ast-rename.js ./react-app/src/components/ ./react-app/src/replaced-components countEntity replaceEntity
```

```
node ast-rename.js ./react-app/src/components/ ./react-app/src/replaced-components Entity replaced
```