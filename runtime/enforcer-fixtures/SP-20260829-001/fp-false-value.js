// FP case 4: the returned object's `ok` value is a compound expression that
// evaluates false (`true && false`), not the literal `true`. A regex that
// substring-matches `ok:\s*true` flags this; the lexer must evaluate the
// full top-level property-value text, not a prefix of it.
function h8() {
  try {
    doSomething();
  } catch (e) {
    return { ok: true && false };
  }
}
module.exports = { h8 };
