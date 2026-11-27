const crypto = require("crypto");
const token = crypto.randomBytes(48).toString("base64url");
const hash = crypto.createHash("sha256").update(token).digest("hex");
console.log("TOKEN ADMINISTRATIVO (guarde em local seguro; aparece apenas agora):");
console.log(token);
console.log("\nAdicione esta linha ao .env:");
console.log(`ADMIN_TOKEN_SHA256=${hash}`);
