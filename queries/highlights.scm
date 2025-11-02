
; =======================
; Somnium highlights.scm
; =======================

; --- Keywords (declarations)
((class_decl  ("class")  @keyword))
((struct_decl ("struct") @keyword))
((trait_decl  ("trait")  @keyword))
((record_decl ("record") @keyword))
((service_decl ("service") @keyword))
((enum_decl   ("enum")   @keyword))
((type_decl   ("type")   @keyword))
((module_decl ("module") @keyword))
((extend_decl ("extend") @keyword))
((event_decl  ("event")  @keyword))

; --- Functions / methods
((func_decl ("func")   @keyword.function))
((func_decl ("method") @keyword.function))
((func_decl ("trans")  @keyword.function))
((constructor_decl ("new") @keyword))
((destructor_decl ("drop") @keyword))

; --- Visibility / modifiers
("public")  @keyword.modifier
("private") @keyword.modifier
("extern")  @keyword.modifier
("static")  @keyword.modifier
("async")   @keyword.modifier
("mut")     @keyword.modifier
("unique")  @keyword.modifier
("shared")  @keyword.modifier
("ref")     @keyword.modifier
("borrow")  @keyword.modifier

; --- Control flow
("if")      @keyword.control.conditional
("elif")    @keyword.control.conditional
("else")    @keyword.control.conditional
("for")     @keyword.control.repeat
("parfor")  @keyword.control.repeat
("while")   @keyword.control.repeat
("do")      @keyword.control.repeat
("loop")    @keyword.control.repeat
("match")   @keyword.control.conditional
("try")     @keyword.control
("catch")   @keyword.control
("throw")   @keyword.control
("return")  @keyword.control.return
("break")   @keyword.control
("continue")@keyword.control
("yield")   @keyword.control
("await")   @keyword.control

; --- Other keywords
("use")     @keyword
("on")      @keyword
("as")      @keyword
("is")      @keyword
("in")      @keyword
("of")      @keyword
("to")      @keyword
("from")    @keyword
("sizeof")  @keyword
("alignof") @keyword
("typeof")  @keyword
("source")  @keyword
("prop")    @keyword
("get")     @keyword
("set")     @keyword

; --- Booleans / null
((bool_literal) @boolean)
((null_literal) @constant.builtin)

; --- Numbers / strings
((int_literal)   @number)
((float_literal) @number)
((string_literal) @string)

; --- Identifiers
((path_expr (ident) @identifier))
((literal_expr (ident) @identifier)) ; fallback if any

; --- Function / method names
((func_decl name: (ident) @function.definition))
((member_expr method: (ident) @function.method))
((member_expr property: (ident) @property))

; --- Parameters
((parameters (positional_param (pattern) @variable.parameter)))
((named_param (ident) @variable.parameter))

; --- Operators
((assignment_expr operator: (_) @operator))
((binary_expr_mul operator: (_) @operator))
((binary_expr_add operator: (_) @operator))
((binary_expr_cmp operator: (_) @operator))
((binary_expr_and "&&" @operator))
((binary_expr_or  "||" @operator))
((binary_expr_nullish "??" @operator))
((binary_expr_pipe operator: (_) @operator))
((unary_expr operator: (_) @operator))

; --- Labels
((LABEL) @label)

; --- Comments
((DOC_LINE)        @comment.documentation)
((DOC_BLOCK)       @comment.documentation)
((LINE_COMMENT)    @comment)
((MULTI_LINE_COMMENT) @comment)

; --- Brackets / punctuation
["(" ")" "{" "}" "[" "]" "," ":" ";" "."] @punctuation.bracket
