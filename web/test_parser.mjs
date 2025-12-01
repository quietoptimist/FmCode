import pkg from './src/lib/engine/parser.ts';
const { parseAndLinkFM } = pkg;

const testCode = `
Section:
  Obj1 = Fn1(
    arg1,
    arg2
  ) > out1 // Comment on last line

  Obj2 = Fn2() // Comment on single line
  
  // Preceding comment
  Obj3 = Fn3(
    arg1
  ) // Comment on last line of Obj3
`;

try {
    const result = parseAndLinkFM(testCode);
    console.log(JSON.stringify(result.ast.objects, null, 2));
} catch (e) {
    console.error(e);
}
