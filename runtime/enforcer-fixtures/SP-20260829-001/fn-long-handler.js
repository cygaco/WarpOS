// FN case 2: handler body exceeds 300 characters before the permissive
// outcome. An old detector that capped its scan window (e.g. `[^}]{0,300}`)
// never reaches process.exit(0) below. Real brace matching has no length cap.
function h2() {
  try {
    doSomething();
  } catch (e) {
    // padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding padding
    process.exit(0);
  }
}
module.exports = { h2 };
