interface Token{
    type: string;
    value:string;
}
function tokenizer(input: string) : Token[] {
    let current :number = 0;
    let tokens: Token[] = [];

while (current< input.length){

    let char:string = input[current];

    if(char==='('){
        tokens.push({
            type: 'paren',
            value: '(',            
        });

        current++;
        continue;   
    }

    if (char ===')'){
        tokens.push({
            type:'paren',
            value: ')',
        });
        current++;
        continue;
    }

    let WHITESPACE = /\s/;
    if(WHITESPACE.test(char)){
        current++;
        continue;
    }

    let NUMBERS = /[0-9]/;
    if(NUMBERS.test(char)){
        let value = '';
        while(NUMBERS.test(char)){
            value += char;
            char = input[++current];
        }
        tokens.push({
            type: 'number',
            value,
        });
        continue;
    }

    if (char ==='"'){
        
        let value:string = "";

        char = input[++current];


        while(char !== ""){
            value += char;
            char = input[++current];
        }
        char = input [++current];

        tokens.push({
            type:'name',
            value
        });
        continue;
    }
    
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }
  
      tokens.push({ type: 'name', value });
      continue;
    }


    throw new TypeError('I dont know what this character is' + char);

}
return tokens;
}

interface NODE {
                type: string;
                name: string;
                params: any[];
            }
interface AST {
        type: string;
        body: any [];
    }
function parser (tokens: Token[]) : any {
        let current = 0;

        function walk(): any {
            let token = tokens[current];

            if(token.type === 'number'){
                current++;
                return {
                    type: 'NumberLiteral',
                    value: token.value,
                };
            }

            if (token.type === 'string') {
                current++;

                return {
                    type: 'StringLiteral',
                    value: token.value,
                };
            }
            if (
            token.type === 'paren' &&
            token.value === '('
            ) {

            token = tokens[++current];

            

            let node : NODE = {
                type: 'CallExpression',
                name: token.value,
                params: [],
            };

            token = tokens[++current];

            while (
                (token.type !== 'paren') ||
                (token.type === 'paren' && token.value !== ')')
            ) {
                node.params.push(walk());
                token = tokens[current];
            }

            current++;

            return node;

        }

        throw new TypeError(token.type);
        
    }

   
     let ast : AST = {
        type: 'Program',
        body: [],
    };

    while (current < tokens.length) {
        ast.body.push(walk()); 
    }


    return ast;
}
