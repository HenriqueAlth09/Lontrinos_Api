const crypto = require("crypto");

const validarAdmin = (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const hashEsperado = process.env.ADMIN_TOKEN_SHA256;
    if (!token || !hashEsperado || !/^[a-f0-9]{64}$/i.test(hashEsperado)) {
        return res.status(401).json({ erro: "Token administrativo ausente ou não configurado" });
    }
    const recebido = crypto.createHash("sha256").update(token).digest();
    const esperado = Buffer.from(hashEsperado, "hex");
    if (!crypto.timingSafeEqual(recebido, esperado)) {
        return res.status(403).json({ erro: "Token administrativo inválido" });
    }
    req.admin = true;
    next();
};

module.exports = validarAdmin;
