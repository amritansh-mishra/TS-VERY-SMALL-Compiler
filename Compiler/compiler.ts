
//  tokenizer 
//  takes a string of code and breaks it down into an array of tokens


type TokenType = 'paren'|'name'|'number'| 'string';

interface Token {
  type: TokenType;   // what kind of thing it is
  value: string;     // what is the actual text 
};

function tokenizer(input:string): Token[]{
  // acts like a cursor moving along with string , basically tracks
  let current = 0;


  let tokens: Token[] = [];  // result list which will get filled 
   
  // keeps reading till end of the string
  while (current < input.length){
    //looks at current character 
    let char = input[current];

    // checks for open '(' and then push and move on
    if (char === '(') {
      
        tokens.push({
         type: 'paren', 
         value: '(' 
        });

      current++;
      continue;
    }

    // CLOSE PAREN
    if (char === ')') {
     
        tokens.push({  
        type: 'paren', 
        value: ')'
     });

      current++ ;
      continue;
    }

    // WHITESPACE are  meaningless in LISP , so we skip it
    let WHITESPACE = /\s/;
    if (char && WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // checking for numbers cause tokens can be a number or sequence of characters, cause number can be 2(one token), 123(one token) , 3444(one token)
    let NUMBERS = /[0-9]/;

    if (char && NUMBERS.test(char)) {

      let value = '';

      while (char && NUMBERS.test(char)) {
        value += char;  // keeps adding digits e.g '1' '2' '3' -> '123'
        current++;
        char = input[current];
      }

      tokens.push({
         type: 'number', 
         value
     });

      continue;
    }

    
    if (char === '"') { // detects literals eg.'helo world'
      let value = '';

      // skips opening quote
      current++;
      char = input[current];

      // stops at the closing quote or end of input
      while (char !== undefined && char !== '"') {
        value += char;
        current++;
        char = input[current];
      }

      // typesafety check for - no closing quote found
      if (char === undefined) {
        throw new TypeError('Unterminated string: expected closing double quote');
      }

      // skip the closing quote
      current++;

      tokens.push ({ 
        type: 'string',
         value 
        });

      continue;
    }

    // keeps collecting letter e.g add , multiply 
    // until a non-letter appears
    let LETTERS = /[a-zA-Z]/;
    if (char && LETTERS.test(char)) {
      let value = '';

      while (char && LETTERS.test(char)) {
        value += char;
        current++;
        char = input[current];
      }

      tokens.push ({ 
        type: 'name', 
        value            //'multiply'
    });

      continue;
    }

    throw new TypeError(' dont know this character: ' + char);
  }

  return tokens;
}

//Result it generates -------

// (         → paren
// add       → name
// 2         → number
// (         → paren
// subtract  → name
// 4         → number
// 2         → number
// )         → paren
// )         → paren

//HOW OUR TOKEN LOOKS LIKE -----------
//   [
        //   { type:'paren',  value:'(' },
        //   { type:'name',   value:'add' },
        //   { type:'number', value:'2' },
        //   { type:'paren',  value:'(' },
        //   { type:'name',   value:'subtract' },
        //   { type:'number', value:'4' },
        //   { type:'number', value:'2' },
        //   { type:'paren',  value:')' },
        //   { type:'paren',  value:')' },
//  ]




//  PARSER
//  takes the array of tokens and converts it into an AST (ABSTRACT SYNTAX TREE)

// all the interface define the shape of the trees.
interface NumberLiteral {  //leaf node
  type: 'NumberLiteral';
  value: string;
  _context?: any[];
}

interface StringLiteral { //leaf node
  type: 'StringLiteral';
  value: string;
  _context?: any[];
}

interface CallExpression {    // input (multiply 2 3)
  type: 'CallExpression';
  name: string; // add 
  params: ASTNode[];   
  _context?: any[];
}

// input becomes {
//   type: 'CallExpression',
//   name: 'multiply',
//   params: [
//     { type: 'NumberLiteral', value: '2' },
//     { type: 'NumberLiteral', value: '3' }
//   ]
// }

  

interface RootNode {   // the entire program is list of expression
  type: 'Program';
  body: ASTNode[];     // input - (add 2 3) (subtract 4 1)
  _context?: any[];
}

// input becomes - {
//   type: 'Program',
//   body: [ CallExpression, CallExpression ]
// }



// a node can be any of these three shapes
type ASTNode = NumberLiteral| StringLiteral| CallExpression;

function parser(tokens: Token[]): RootNode {
  let current = 0;

  // walk() reads ONE expression and returns its AST node
  // calls itself recursively for nested expressions
  function walk(): ASTNode {
    let token = tokens[current];

    // NUMBER — becomes a NumberLiteral leaf node
    if (token?.type === 'number'){

      current++; 
      return { 
        type: 'NumberLiteral', 
        value: token.value
        };

    }

    // STRING — becomes a StringLiteral leaf node
    if (token?.type === 'string') {
      current++;
      return {
         type: 'StringLiteral',
          value: token.value
         };
    }

    // '('— means a CallExpression is starting
    if (token?.type === 'paren' && token.value === '(') {

      // skip '(' and move to the function name
      current++;

      token = tokens[current];

      // build the CallExpression node — name comes from the token right after '('
      let node: CallExpression = {
        type: 'CallExpression',
        name: token.value,    // e.g. ' multiply, add '
        params: [],          // arguments will be pushed below
      };

      
      current++;
      token = tokens[current];

      // keep calling walk() for each argument until we hit the closing ')'
      while (
        (token?.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk()); // returns an AST node and the returned node is added to "params" array
        token = tokens[current]; 
      }

      // skip the closing ')' cause we don't care about paran in the AST
      current++;
      return node;
    }

    throw new TypeError( token?.type);
  }


  let ast: RootNode = {
    type: 'Program',
    body: [],
  };

  // keep calling walk() until all tokens are consumed
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;

}



//   TRAVERSER
//  accepts an AST and a visitor
// a visitor is object where we define what to DO at each node
// enter = called when we first arrive at a node
// exit  = called after all children have been visited


type VisitorMethod<T> = (node:T, parent: ASTNode | RootNode| null) => void;

interface Visitor{

  Program?:{
     enter?: VisitorMethod<RootNode>;
    exit?: VisitorMethod<RootNode>;
  };

  CallExpression?:{
    enter?: VisitorMethod<CallExpression>;
 exit?: VisitorMethod<CallExpression>;
  };

  NumberLiteral?:{
       enter?: VisitorMethod<NumberLiteral>;
    exit?: VisitorMethod<NumberLiteral>;
  };

  StringLiteral?:{
      enter?: VisitorMethod<StringLiteral>;
    exit?: VisitorMethod<StringLiteral>;
  };

}

function traverser(ast:RootNode, visitor:Visitor):void{

  //  // array is typed as ASTNode[] because Program.body and CallExpression.params use it
  function traverseArray(array:ASTNode[], parent:ASTNode | RootNode):void{
    array.forEach(child => traverseNode(child, parent));   //visit every child   
  }

  function traverseNode(node:ASTNode | RootNode, parent:ASTNode | RootNode |null){
    
    const methods = (visitor as any)[node.type];

    // 1.enters
    if (methods?.enter) {
      methods.enter(node, parent);
    }

    // 2.Action based onn type
    switch (node.type) {  //decides this node have children we need to traverse?
      
      
        case 'Program': 
 //Program contains , body:ASTNode[] , so we traverse every elemenet
        traverseArray(node.body, node);
        break;

      case 'CallExpression':
  //  CallExpression -> params[]
        traverseArray(node.params, node);
        break;

      
      case 'NumberLiteral':
      case 'StringLiteral':
        // leaf node - no need to do anything cause no children present.
        break;

      default:
        throw new TypeError((node as any).type);
    }

    // 3. call exit 
    if (methods?.exit) {
      methods.exit(node, parent);
    }
  }

  // engine sgtarts
  traverseNode(ast, null);
}


//  TRANSFORMER

//  uses the traverser + visitor to convert the "LISP AST" into a "new JS-shaped AST"
//
//  LISP → { name: 'add',  params: [...] }
//  JS   → { callee: { type: 'Identifier', name: 'add' }, arguments: [...] }
//
//  _context is the bridge — each node points to the array



function transformer(ast: RootNode): any {

  // create the base for javascript- tree we're building
  const newAst: any = {
    type: 'Program',
    body: [],
  };

  // point the root's _context at the new tree's body
  // so top-level expressions know where to attach themselves
  (ast as any)._context = newAst.body;
  

  // start to traverse our old AST 
  traverser(ast, {

    // Transform Number (191) -> 191
    NumberLiteral: {
      enter(node, parent) {
        (parent as any)._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },

    // When a StringLiteral is visited, copy it into the parent’s new AST structure.
   
    StringLiteral: {
      enter(node, parent) {
        (parent as any)._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },

    // ( multiply 3 4 ) -> add(2,3)
    CallExpression: {
      enter(node, parent) {

        // build the JS-shaped CallExpression 

        let expression: any = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        
        (node as any)._context = expression.arguments;

        
        if (parent?.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          };
        }

        // pushing this new expression into the parent's context
        (parent as any)._context.push(expression);
      },
    },
  });


  //returns new JS ASTNode
  return newAst;
}



//  THE CODE GENERATOR
//  walks the new JS AST and prints it as a JS string


function codeGenerator(node: any): string {
  switch (node.type) {

    // PROGRAM: generate each statement on its own line
    case 'Program':
      return node.body.map(codeGenerator).join('\n');

    // EXPRESSION STATEMENT — expression followed by a semicolon
    case 'ExpressionStatement':
      return codeGenerator(node.expression) + ';';

    // CALL EXPRESSION — name(arg1, arg2, ...)
    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator).join(', ') +
        ')'
      );

    // for this we will just return the node's name
      case 'Identifier':
      return node.name;

    //will return just the nodes value
    case 'NumberLiteral':
      return node.value;

    // add quotation around the node value
    case 'StringLiteral':
      return '"' + node.value + '"';

    default:
      throw new TypeError('Unknown node type: ' + node.type);
  }
}



//  THE COMPILER 
//  string → tokens → AST → new AST → JS string


function compiler(input: string): string {
  const tokens = tokenizer(input);  //  string  → tokens
  const ast    = parser(tokens);    //  tokens  → LISP AST
  const newAst = transformer(ast);  //  LISP AST → JS AST
  const output = codeGenerator(newAst); // JS AST → string
  return output;
}



//  TEST 
const lispCode = '(multiply 3 (multiply 4 5))';
const jsCode   = compiler(lispCode);

console.log('--- LISP INPUT ---');
console.log(lispCode);

console.log('\n--- JS OUTPUT ---');
console.log(jsCode);
// → multiply(3, multiply(4, 5));