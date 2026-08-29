// FP case 3: process.exit(0) is unreachable — it is preceded, unconditionally
// and at the top level of the handler, by a `throw`. A regex with no
// reachability awareness flags this; the lexer must not.
function h7() {
  try {
    doSomething();
  } catch (e) {
    throw e;
    process.exit(0);
  }
}
module.exports = { h7 };
