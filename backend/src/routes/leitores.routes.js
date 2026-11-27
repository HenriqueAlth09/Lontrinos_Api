const router = require("express").Router();
const leitor = require("../controllers/leitores.controller");
const validarLogin = require("../middlewares/validaLogin");

router.post("/cadastrar", leitor.cadastrar);
router.post("/login", leitor.login);
router.get("/perfil", validarLogin, leitor.perfil);
router.put("/perfil", validarLogin, leitor.atualizarPerfil);
router.delete("/perfil", validarLogin, leitor.excluirConta);

module.exports = router;
