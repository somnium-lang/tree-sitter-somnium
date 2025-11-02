
; ====================
; Somnium locals.scm
; ====================
; Identify scopes (blocks, functions, types with bodies)

(block) @scope
(block_expr (block) @scope)
(class_type_expr (structure_stmt) @scope)
(record_type_expr (structure_stmt) @scope)
(trait_type_expr (structure_stmt) @scope)
(struct_type_expr (structure_stmt) @scope)

(structure_body) @scope

; Function-like scopes
(func_decl (block) @scope)
(constructor_decl (block) @scope)
(destructor_decl (block) @scope)

; --- Definitions
(func_decl name: (ident) @definition.function)
(class_decl (ident) @definition.type)
(struct_decl (ident) @definition.type)
(trait_decl  (ident) @definition.type)
(record_decl (ident) @definition.type)
(service_decl (ident) @definition.type)
(enum_decl   (ident) @definition.type)
(type_decl   (ident) @definition.type)
(event_decl  (ident) @definition.event)
(field_decl  (ident) @definition.field)
(prop_decl   (ident) @definition.property)

(parameters (positional_param (pattern) @definition.parameter))
(named_param (ident) @definition.parameter)

; Let bindings: bind_pattern and destructuring
(let_stmt (var_pattern) @definition.variable)
(bind_pattern (ident) @definition.variable)

; --- References
(path_expr (ident) @reference)

(member_expr property: (ident) @reference.property)
(member_expr method:   (ident) @reference.function)

; Labels as names (lightweight)
(LABEL) @definition.label
