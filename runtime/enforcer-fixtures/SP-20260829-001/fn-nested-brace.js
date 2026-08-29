// FN case 1: nested brace inside the catch handler (an if-block) before the
// permissive outcome. Old non-brace-aware regex ([^}]*) stops at the nested
// "}" and never reaches process.exit(0). The lexer must do real brace
// matching to find it.
function h1() {
  try {
    doSomething();
  } catch (e) {
    if (isRecoverable(e)) {
      logWarn(e);
    }
    process.exit(0);
  }
}
module.exports = { h1 };
