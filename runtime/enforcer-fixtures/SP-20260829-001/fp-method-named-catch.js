// FP case 2: a method literally named `catch` on a class, with no preceding
// `try` block. A regex matching bare `catch(...) { ... }` flags this; the
// lexer must require a catch CLAUSE (immediately following a matched try
// block), not a catch-shaped method name.
class R {
  catch() {
    process.exit(0);
  }
}
module.exports = { R };
