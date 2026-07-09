const fs=require("fs");
const j=require("./pl-buildspec.out.json".replace("./","./design/").replace("design/design","design")) || require("/c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/sp-20260619-001/design/pl-buildspec.out.json");
fs.writeFileSync("/c/Users/Vlad/Desktop/Claude/Projects/WarpOS/runtime/sp-20260619-001/design/BUILD-SPEC.md","# SP-20260619-001 build_spec (product-lead, GPT-5.5) — AcmeLaunch genericization\n\n"+(j.output||j.text||"")+"\n");
console.log("saved BUILD-SPEC.md");
