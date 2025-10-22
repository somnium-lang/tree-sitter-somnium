/**
 * @file Somnium grammar for tree-sitter
 * @author Sanne Ladage <sanne@dreamlogics.com>
 * @license Apache 2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "somnium",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
