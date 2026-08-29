// FP case 1: the pattern text appears inside a string literal, not as real
// code. A regex with no string-state tracking flags this; the lexer must not.
function h5() {
  try {
    doSomething();
  } catch (e) {
    logError("saw pattern: process.exit(0) in legacy code, not calling it");
    return { ok: false };
  }
}
module.exports = { h5 };
