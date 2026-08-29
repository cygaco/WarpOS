// FN case 3: spacing variant of process.exit(0). A literal `process\.exit\(0\)`
// regex with no whitespace tolerance misses this.
function h3() {
  try {
    doSomething();
  } catch (e) {
    process . exit ( 0 ) ;
  }
}
module.exports = { h3 };
