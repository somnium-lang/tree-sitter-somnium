
; ==================
; Somnium tags.scm
; ==================

(func_decl name: (ident) @function)
(constructor_decl (ident) @function)
(destructor_decl (ident) @function)

(class_decl  (ident) @type)
(struct_decl (ident) @type)
(trait_decl  (ident) @type)
(record_decl (ident) @type)
(service_decl (ident) @type)

(enum_decl (ident) @type)
(enum_case_decl (ident) @constant)

(type_decl (ident) @type)

(event_decl (ident) @function)

(field_decl (ident) @field)
(prop_decl  (ident) @property)
