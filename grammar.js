/**
 * @file Somnium grammar for tree-sitter
 * @author Sanne Ladage <sanne@dreamlogics.com>
 * @license Apache 2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "somnium",

  word: ($) => $.ident,

  extras: ($) => [$.WHITESPACE, $.COMMENT],

  supertypes: ($) => [
    $.expr,
    $.primary_expr,
    $.type_expr,
    $.pattern,
    $.stmt,
    $.decl,
    $.structure_stmt,
  ],

  conflicts: ($) => [
    // Common ambiguous spots between types vs expr vs patterns
    [$.path, $.ident_type],
    [$.path_expr, $.path],
    [$.group_or_tuple_expr, $.group_or_tuple_type],
    [$.tuple_pattern, $.group_pattern, $.group_or_tuple_expr],
    [$.struct_expr, $.struct_pattern],
    [$.func_type_params, $.parameters],
    [$.named_params, $.map_expr],
    [$.call, $.group_or_tuple_expr],
  ],

  precedences: ($) => [
    // Highest: postfix, then prefix, multiplicative, additive, comparisons, logical, pipes, assign
    [
      "postfix",
      "unary",
      "mul",
      "add",
      "cmp",
      "and",
      "or",
      "nullish",
      "pipe",
      "assign",
    ],
  ],

  rules: {
    // ──────────────────────────
    // LEXICAL
    // ──────────────────────────
    WHITESPACE: (_) => token(/[ \t\r\n]+/),

    DOC_LINE: (_) => token(seq("///", /[^\n]*/)),
    DOC_BLOCK: (_) => token(seq("/**", repeat(/[^*]|\*+[^*/]/), "*+/")),

    LINE_COMMENT: (_) => token(seq("//", /[^\n]*/)),
    MULTI_LINE_COMMENT: (_) => token(seq("/*", repeat(/[^*]|\*+[^*/]/), "*+/")),

    COMMENT: ($) =>
      choice($.DOC_LINE, $.DOC_BLOCK, $.LINE_COMMENT, $.MULTI_LINE_COMMENT),

    ident: (_) => token(/[A-Za-z_][A-Za-z0-9_]*/),

    LABEL: ($) => seq("#:", $.ident),

    // string + escapes
    string_literal: ($) =>
      token(
        seq(
          '"',
          repeat(
            choice(
              /[^"\\]+/,
              seq(
                "\\",
                choice(
                  '"',
                  "\\",
                  "n",
                  "r",
                  "t",
                  "0",
                  seq("u{", /[0-9A-Fa-f]{1,6}/, "}"),
                ),
              ),
            ),
          ),
          '"',
        ),
      ),

    // numbers
    int_literal: (_) =>
      token(
        seq(
          optional(/[+-]/),
          choice(
            /0x[0-9A-Fa-f](?:_?[0-9A-Fa-f])*/,
            /0b[01](?:_?[01])*/,
            /0o[0-7](?:_?[0-7])*/,
            /0|[1-9](?:_?\d)*/,
          ),
          optional(/[iu](?:8|16|32|64|128|256)?/),
        ),
      ),

    float_literal: (_) =>
      token(
        seq(
          optional(/[+-]/),
          choice(
            // with point (optional exponent)
            /(?:\d(?:_?\d)*)?\.(?:\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?/,
            // exponent only
            /\d(?:_?\d)*(?:[eE][+-]?\d(?:_?\d)*)/,
          ),
          optional(/f(?:32|64)/),
        ),
      ),

    bool_literal: (_) => token(choice("true", "false")),
    null_literal: (_) => token("null"),

    // ──────────────────────────
    // KEYWORDS (declared as literals where used)
    // ──────────────────────────

    // ──────────────────────────
    // BASE UNITS
    // ──────────────────────────
    unit: ($) => seq(repeat($.top_level_stmt)),

    script_unit: ($) => seq(repeat($.stmt), optional($.expr)),

    // ──────────────────────────
    // IDENTIFIERS / PATHS / GENERICS
    // ──────────────────────────
    generic_arg: ($) => choice($.type_expr, $.literal),

    generic_args: ($) =>
      seq("[", $.generic_arg, repeat(seq(",", $.generic_arg)), "]"),

    path_segment: ($) => seq($.ident, optional($.generic_args)),

    path: ($) => seq($.path_segment, repeat(seq("::", $.path_segment))),

    // ──────────────────────────
    // DECLARATIONS
    // ──────────────────────────
    decl: ($) =>
      choice(
        $.func_decl,
        $.class_decl,
        $.trait_decl,
        $.struct_decl,
        $.record_decl,
        $.type_decl,
        $.service_decl,
        $.event_decl,
        $.enum_decl,
      ),

    top_level_decl: ($) => choice($.decl, $.module_decl, $.extend_decl),

    decl_visibility: (_) => choice("public", "private"),

    decl_mod: ($) =>
      seq(optional($.decl_visibility), optional("extern"), optional("static")),

    generic_params: ($) =>
      seq(
        "[",
        optional(seq($.generic_param, repeat(seq(",", $.generic_param)))),
        "]",
      ),

    generic_param: ($) =>
      choice(
        $.generic_param_type,
        $.generic_param_literal,
        $.generic_param_match,
      ),

    generic_param_type: ($) =>
      seq($.ident, optional(seq("typeof", $.type_expr))),
    generic_param_literal: ($) => seq($.ident, ":", $.type_expr),
    generic_param_match: ($) => seq($.ident, "is", $.type_expr),

    // ── functions
    positional_param: ($) => seq($.pattern, optional(seq(":", $.type_expr))),
    positional_params: ($) =>
      seq($.positional_param, repeat(seq(",", $.positional_param))),

    named_param: ($) =>
      seq($.ident, optional(seq(":", $.type_expr)), optional(seq("=", $.expr))),
    named_params: ($) =>
      seq(
        "{",
        optional(seq($.named_param, repeat(seq(",", $.named_param)))),
        "}",
      ),

    parameters: ($) =>
      seq(
        "(",
        optional(
          choice(
            seq($.positional_params, optional(seq(",", $.named_params))),
            $.named_params,
          ),
        ),
        ")",
      ),

    ret_type: ($) => $.type_expr,
    fn_type: ($) => $.type_expr,

    func_decl: ($) =>
      seq(
        $.decl_mod,
        optional("async"),
        choice("func", "method", "trans"),
        optional("mut"),
        $.ident,
        optional($.generic_params),
        $.parameters,
        optional(seq("->", $.ret_type)),
        optional(seq(":", $.fn_type)),
        choice($.block, ";"),
      ),

    // constructor / destructor / props
    ctor_positional_param: ($) =>
      choice(
        seq($.pattern, optional(seq(":", $.type_expr))),
        seq("self", ".", $.ident),
      ),
    ctor_positional_params: ($) =>
      seq($.ctor_positional_param, repeat(seq(",", $.ctor_positional_param))),
    ctor_named_param: ($) =>
      choice(
        seq(
          $.ident,
          optional(seq(":", $.type_expr)),
          optional(seq("=", $.expr)),
        ),
        seq("self", ".", $.ident),
      ),
    ctor_named_params: ($) =>
      seq(
        "{",
        optional(seq($.ctor_named_param, repeat(seq(",", $.ctor_named_param)))),
        "}",
      ),
    ctor_parameters: ($) =>
      // NOTE: Pest had a trailing '}' typo after ')'; using ')'
      seq(
        "(",
        optional(
          choice(
            seq(
              $.ctor_positional_params,
              optional(seq(",", $.ctor_named_params)),
            ),
            $.ctor_named_params,
          ),
        ),
        ")",
      ),

    constructor_decl: ($) =>
      seq(
        $.decl_mod,
        "new",
        optional($.ident),
        $.ctor_parameters,
        optional(seq("->", $.type_expr)),
        optional(seq(":", $.type_expr)),
        choice($.block, ";"),
      ),

    destructor_decl: ($) =>
      seq(
        $.decl_mod,
        "drop",
        optional(
          seq(
            $.ident,
            optional($.generic_params),
            $.parameters,
            optional(seq("->", $.ret_type)),
          ),
        ),
        choice($.block, ";"),
      ),

    prop_body: ($) =>
      seq(
        "{",
        choice(
          seq($.prop_getter, optional($.prop_setter)),
          seq($.prop_setter, optional($.prop_getter)),
        ),
        "}",
      ),

    prop_getter: ($) => seq($.decl_mod, "get", choice($.block, ";")),

    prop_setter: ($) =>
      seq($.decl_mod, "set", choice(seq($.ident, $.block), ";")),

    prop_decl: ($) =>
      seq(
        $.decl_mod,
        "prop",
        $.ident,
        optional(seq(":", $.type_expr)),
        choice($.prop_body, ";"),
      ),

    // enum
    enum_decl: ($) =>
      seq(
        $.decl_mod,
        "enum",
        $.ident,
        optional($.generic_params),
        choice($.enum_body, ";"),
      ),

    enum_body: ($) => seq("{", repeat($.enum_stmt), "}"),
    enum_stmt: ($) => $.enum_decl_stmt,
    enum_decl_stmt: ($) => choice($.enum_case_decl, $.func_decl),
    enum_case_decl: ($) =>
      seq("case", $.ident, optional(seq("=", $.literal)), ";"),

    // module
    module_decl: ($) => seq(optional($.decl_visibility), "module", $.path, ";"),

    // structures
    structure_implements: ($) => seq(":", $.path, repeat(seq(",", $.path))),

    class_mod: (_) =>
      seq(optional("async"), optional(choice("unique", "shared"))),

    class_decl: ($) =>
      seq(
        $.decl_mod,
        $.class_mod,
        "class",
        $.ident,
        optional($.generic_params),
        optional($.structure_implements),
        $.structure_body,
      ),

    structure_body: ($) => choice(seq("{", repeat($.structure_stmt), "}"), ";"),

    structure_stmt: ($) =>
      choice($.structure_decl_stmt, $.decl_stmt, $.on_stmt),

    structure_decl_stmt: ($) =>
      choice($.constructor_decl, $.destructor_decl, $.prop_decl, $.field_decl),

    record_decl: ($) =>
      seq(
        $.decl_mod,
        "record",
        $.ident,
        optional($.generic_params),
        optional($.structure_implements),
        $.structure_body,
      ),

    trait_decl: ($) =>
      seq(
        $.decl_mod,
        "trait",
        $.ident,
        optional($.generic_params),
        optional($.structure_implements),
        $.structure_body,
      ),

    struct_decl: ($) =>
      seq(
        $.decl_mod,
        "struct",
        $.ident,
        optional($.generic_params),
        optional($.structure_implements),
        $.structure_body,
      ),

    service_decl: ($) =>
      seq(
        $.decl_mod,
        "service",
        $.ident,
        optional($.structure_implements),
        $.structure_body,
      ),

    extend_decl: ($) =>
      seq(
        $.decl_mod,
        "extend",
        $.path,
        $.structure_implements,
        $.structure_body,
      ),

    event_decl: ($) => seq($.decl_mod, "event", $.ident, $.parameters, ";"),

    field_decl: ($) =>
      seq(
        $.decl_mod,
        "let",
        $.ident,
        optional(seq(":", $.type_expr)),
        optional(seq("=", $.expr)),
        ";",
      ),

    // type decl
    type_decl: ($) => seq($.decl_mod, "type", $.ident, "=", $.type_expr, ";"),

    // ──────────────────────────
    // STATEMENTS
    // ──────────────────────────
    stmt: ($) =>
      choice(
        $.decl_stmt,
        $.let_stmt,
        $.expr_stmt,
        $.use_stmt,
        $.on_stmt,
        $.catch_stmt,
      ),

    top_level_stmt: ($) =>
      choice($.top_level_decl_stmt, $.use_stmt, $.source_stmt),

    top_level_decl_stmt: ($) => $.top_level_decl,

    decl_stmt: ($) => $.decl,

    let_stmt: ($) =>
      seq(
        "let",
        $.var_pattern,
        optional(seq(":", $.type_expr)),
        optional(seq("=", $.expr)),
        ";",
      ),

    // on(...)
    on_positional_param_binds: ($) =>
      seq($.pattern, repeat(seq(",", $.pattern))),
    on_named_param_bind: ($) => seq($.ident, ":", $.pattern),
    on_named_param_binds: ($) =>
      seq($.on_named_param_bind, repeat(seq(",", $.on_named_param_bind))),
    on_param_binds: ($) =>
      seq(
        "(",
        optional(
          choice(
            seq(
              $.on_positional_param_binds,
              optional(seq(",", $.on_named_param_binds)),
            ),
            $.on_named_param_binds,
          ),
        ),
        ")",
      ),

    on_stmt: ($) => seq("on", $.path, $.on_param_binds, $.block),

    catch_stmt: ($) =>
      seq("catch", $.ident, optional(seq(":", $.type_expr)), $.block),

    expr_stmt: ($) =>
      choice(seq($.block_kind_expr, optional(";")), seq($.expr, ";")),

    block: ($) => seq("{", repeat($.stmt), optional($.expr), "}"),

    use_stmt: ($) =>
      seq(
        "use",
        $.path,
        "::",
        "{",
        optional(seq($.use_item, repeat(seq(",", $.use_item)))),
        "}",
        optional($.use_alias),
      ),

    use_item: ($) => seq($.path, optional($.use_alias)),

    use_alias: ($) => seq("as", $.ident),

    source_stmt: ($) => seq("source", $.string_literal, ";"),

    // ──────────────────────────
    // EXPRESSIONS
    // ──────────────────────────
    expr: ($) =>
      prec.left(
        "assign",
        seq(
          optional($.prefix_expr),
          $.primary_expr,
          optional($.postfix_expr),
          repeat(
            seq(
              $.infix_expr,
              optional($.prefix_expr),
              $.primary_expr,
              optional($.postfix_expr),
            ),
          ),
        ),
      ),

    block_kind_expr: ($) =>
      choice(
        $.block_expr,
        $.if_expr,
        $.for_expr,
        $.parfor_expr,
        $.while_expr,
        $.loop_expr,
        $.do_while_expr,
      ),

    block_expr: ($) => seq(optional($.LABEL), $.block),

    primary_expr: ($) =>
      choice(
        $.block_kind_expr,
        $.struct_expr,
        $.path_expr,
        $.literal_expr,
        $.group_or_tuple_expr,
        $.match_expr,
        $.enumerable_expr,
        $.map_expr,
        $.try_expr,
        $.class_type_expr,
        $.record_type_expr,
        $.trait_type_expr,
        $.struct_type_expr,
        $.return_expr,
        $.throw_expr,
        $.break_expr,
        $.continue_expr,
        $.yield_expr,
      ),

    path_expr: ($) => $.path,

    literal_expr: ($) => $.literal,

    elif: ($) => seq("elif", $.expr, $.block),

    else_block: ($) => seq("else", $.block),

    if_expr: ($) =>
      seq("if", $.expr, $.block, repeat($.elif), optional($.else_block)),

    for_to_bind: ($) =>
      seq(
        "to",
        $.var_pattern,
        optional(seq(":", $.type_expr)),
        optional(seq("=", $.expr)),
      ),

    for_expr: ($) =>
      seq(
        optional("async"),
        "for",
        optional(seq($.ident, "=>")),
        $.pattern,
        "in",
        $.expr,
        $.for_to_bind,
        optional($.LABEL),
        $.block,
      ),

    parfor_expr: ($) =>
      seq(
        optional("async"),
        "parfor",
        optional(seq($.ident, "=>")),
        $.pattern,
        "in",
        $.expr,
        $.for_to_bind,
        optional($.LABEL),
        $.block,
      ),

    while_expr: ($) => seq("while", $.expr, optional($.LABEL), $.block),

    do_while_expr: ($) =>
      seq("do", optional($.LABEL), $.block, "while", $.expr),

    loop_expr: ($) => seq("loop", optional($.LABEL), $.block),

    await_expr: (_) => seq(".", "await"),

    named_argument: ($) => seq($.ident, ":", $.expr),
    named_args: ($) =>
      seq($.named_argument, repeat(seq(",", $.named_argument))),
    positional_args: ($) => seq($.expr, repeat(seq(",", $.expr))),

    call: ($) =>
      prec(
        "postfix",
        seq(
          "(",
          optional(
            choice(
              seq($.positional_args, optional(seq(",", $.named_args))),
              $.named_args,
            ),
          ),
          ")",
          optional($.enumerable_expr), // trailing array literal as in Pest (builder?)
        ),
      ),

    dot_access: (_) => ".",
    dot_maybe_access: (_) => "?.",

    method_call: ($) =>
      prec(
        "postfix",
        seq(
          choice($.dot_access, $.dot_maybe_access),
          $.ident,
          optional($.generic_args),
          $.call,
        ),
      ),

    field_expr: ($) => prec("postfix", seq(".", $.ident)),

    group_or_tuple_expr: ($) => seq("(", repeat($.expr), ")"),

    match_expr: ($) =>
      seq(
        "match",
        $.expr,
        "{",
        optional(
          seq($.match_case, repeat(seq(",", $.match_case)), optional(",")),
        ),
        "}",
      ),

    match_guard: ($) => seq("if", $.expr),

    match_case_body: ($) => choice($.block, $.expr),

    match_case: ($) =>
      seq($.pattern, optional($.match_guard), "=>", $.match_case_body),

    enumerable_expr: ($) =>
      seq("[", $.expr, repeat(seq(",", $.expr)), optional(","), "]"),

    map_pair: ($) => seq($.expr, ":", $.expr),

    map_expr: ($) =>
      seq(
        "[",
        optional(seq($.map_pair, repeat(seq(",", $.map_pair)), optional(","))),
        "]",
      ),

    struct_expr_pair: ($) => seq($.ident, ":", $.expr),

    struct_expr: ($) =>
      seq(
        optional($.path),
        "{",
        optional(
          seq(
            $.struct_expr_pair,
            repeat(seq(",", $.struct_expr_pair)),
            optional(","),
          ),
        ),
        "}",
      ),

    catch_clause: ($) =>
      seq("catch", $.ident, optional(seq(":", $.type_expr)), $.block),

    try_expr: ($) => seq("try", $.expr, repeat($.catch_clause)),

    return_expr: ($) => seq("return", optional($.expr)),

    throw_expr: ($) => seq("throw", $.expr),

    break_expr: ($) => seq("break", optional($.ident)),

    continue_expr: ($) => seq("continue", optional($.ident)),

    yield_expr: ($) => seq("yield", $.expr, optional(seq("in", $.ident))),

    class_type_expr: ($) => seq("class", "{", repeat($.structure_stmt), "}"),
    record_type_expr: ($) => seq("record", "{", repeat($.structure_stmt), "}"),
    trait_type_expr: ($) => seq("trait", "{", repeat($.structure_stmt), "}"),
    struct_type_expr: ($) => seq("struct", "{", repeat($.structure_stmt), "}"),

    // Operators
    infix_expr: ($) =>
      choice(
        alias("==", $.eq_op),
        alias("!=", $.ne_op),
        alias("<=", $.le_op),
        alias(">=", $.ge_op),
        alias("&&", $.and_op),
        alias("||", $.or_op),
        alias("??", $.null_coalescing_op),
        alias("|>", $.pipe_op),
        alias("?>", $.optional_pipe_op),
        alias(":=", $.assign_op),
        alias("+=", $.add_assign_op),
        alias("-=", $.sub_assign_op),
        alias("*=", $.mul_assign_op),
        alias("/=", $.div_assign_op),
        alias("%=", $.mod_assign_op),
        alias("+", $.add_op),
        alias("-", $.sub_op),
        alias("*", $.mul_op),
        alias("/", $.div_op),
        alias("%", $.mod_op),
        alias("<", $.lt_op),
        alias(">", $.gt_op),
      ),

    // prefix
    prefix_expr: ($) =>
      prec(
        "unary",
        choice(
          alias("+", $.plus_sign),
          alias("-", $.minus_sign),
          alias("~", $.signal_op),
          alias("move", $.move_op),
          alias("copy", $.copy_op),
          alias("!", $.inverse_op),
        ),
      ),

    // postfix
    postfix_expr: ($) =>
      prec(
        "postfix",
        choice(
          alias("++", $.inc_op),
          alias("--", $.dec_op),
          alias("!", $.unwrap_op),
          alias("?", $.optional_op),
          $.await_expr,
          $.method_call,
          $.field_expr,
          $.call,
        ),
      ),

    // ──────────────────────────
    // TYPES
    // ──────────────────────────
    type_expr: ($) => $.result_type,

    result_type: ($) => seq($.union_type, optional(seq("!!", $.union_type))),

    union_type: ($) => seq($.primary_type, repeat(seq("|", $.primary_type))),

    primary_type: ($) =>
      choice(
        $.ref_type,
        $.option_type,
        $.future_type,
        $.reactive_type,
        $.enumerable_type,
        $.array_type,
        $.func_type,
        $.group_or_tuple_type,
        $.ident_type,
      ),

    ident_type: ($) => $.ident,

    ref_type: ($) =>
      seq(
        choice("&mut", "borrow", "&", "*", "unique", "shared"),
        $.primary_type,
      ),

    option_type: ($) => seq("?", $.primary_type),
    future_type: ($) => seq("^", $.primary_type),

    reactive_type: ($) => seq(choice("~mut", "~"), $.primary_type),

    enumerable_type: ($) => seq("[", $.primary_type, "]"),

    array_type: ($) => seq("[", $.primary_type, ";", $.int_literal, "]"),

    func_type_params: ($) =>
      seq(
        "(",
        optional(
          choice(
            seq(
              $.func_type_positional_params,
              optional(seq(",", $.func_type_named_params)),
            ),
            $.func_type_named_params,
          ),
        ),
        ")",
      ),

    func_type_positional_params: ($) =>
      seq(
        $.func_type_positional_param,
        repeat(seq(",", $.func_type_positional_param)),
      ),
    func_type_positional_param: ($) =>
      seq(optional(seq($.ident, ":")), $.type_expr),

    func_type_named_params: ($) =>
      seq(
        "{",
        $.func_type_named_param,
        repeat(seq(",", $.func_type_named_param)),
        "}",
      ),
    func_type_named_param: ($) => seq($.ident, ":", $.type_expr),

    func_type_return_type: ($) => seq("->", $.type_expr),

    func_type: ($) =>
      seq("func", $.func_type_params, optional($.func_type_return_type)),

    group_or_tuple_type: ($) =>
      seq("(", $.type_expr, repeat(seq(",", $.type_expr)), ")"),

    // ──────────────────────────
    // PATTERNS
    // ──────────────────────────
    pattern: ($) =>
      choice(
        $.tuple_case_pattern,
        $.struct_case_pattern,
        $.bind_pattern,
        $.wildcard_pattern,
        $.literal_pattern,
        $.tuple_pattern,
        $.group_pattern,
      ),

    // patterns safe for let
    var_pattern: ($) =>
      choice(
        $.bind_pattern,
        $.wildcard_pattern,
        $.tuple_pattern,
        $.struct_pattern,
      ),

    bind_pattern: ($) => seq(optional("ref"), optional("mut"), $.ident),

    wildcard_pattern: (_) => "_",

    literal_pattern: ($) => $.literal,

    tuple_pattern: ($) =>
      seq("(", $.pattern, choice(repeat1(seq(",", $.pattern)), ","), ")"),

    group_pattern: ($) => seq("(", $.pattern, ")"),

    struct_pattern_field: ($) => seq($.ident, ":", $.pattern),

    struct_pattern: ($) =>
      seq(
        "{",
        $.struct_pattern_field,
        repeat1(seq(",", $.struct_pattern_field)),
        optional(","),
        "}",
      ),

    tuple_case_pattern: ($) => seq($.path, $.tuple_pattern),

    struct_case_pattern: ($) => seq($.path, $.struct_pattern),

    // ──────────────────────────
    // LITERALS
    // ──────────────────────────
    literal: ($) =>
      choice(
        $.float_literal,
        $.int_literal,
        $.bool_literal,
        $.null_literal,
        $.string_literal,
      ),
  },
});
