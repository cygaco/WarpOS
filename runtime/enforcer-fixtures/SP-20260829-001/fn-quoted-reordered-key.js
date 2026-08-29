// FN case 4: quoted key + reordered keys in a success-shaped return object.
// A regex assuming an unquoted `ok:` token in first position misses this.
function h4() {
  try {
    doSomething();
  } catch (e) {
    return { "success": false, "ok": true };
  }
}
module.exports = { h4 };
