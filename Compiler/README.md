 - LISP CODE - (multiply 3 (multiply 4 5))

      
        ↓ TOKENIZER

flat list of labeled chunks
[{paren,'('}, {name,'multiply'}, {number,'2'}, ...]

       
       ↓ PARSER

LISP-shaped tree showing structure
{ CallExpression 'multiply' → [ 2, { CallExpression 'multiply' → [4, 2] } ] }

       ↓ TRANSFORMER

JS-shaped tree
{ callee:'multiply', arguments:[ 2, { callee:'multiply', arguments:[4,2] } ] }

       ↓ CODE GENERATOR

JS string
'multiply(2, multiply(4, 2));'