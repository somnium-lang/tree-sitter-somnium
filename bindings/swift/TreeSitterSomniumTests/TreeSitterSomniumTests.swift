import XCTest
import SwiftTreeSitter
import TreeSitterSomnium

final class TreeSitterSomniumTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_somnium())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Somnium grammar")
    }
}
