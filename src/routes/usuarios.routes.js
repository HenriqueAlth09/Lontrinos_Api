const router = require("express").Router();
const leitor = require("../controllers/leitores.controller");
const admin = require("../controllers/admin.controller");
const validarAdmin = require("../middlewares/validaAdmin");

router.post("/", leitor.cadastrar);
router.post("/cadastrar", leitor.cadastrar);
router.post("/login", leitor.login);
router.get("/", validarAdmin, admin.listar);
router.get("/listar", validarAdmin, admin.listar);
router.get("/buscar/:id", validarAdmin, admin.buscar);
router.get("/:id", validarAdmin, admin.buscar);
router.put("/atualizar/:id", validarAdmin, admin.atualizar);
router.put("/:id", validarAdmin, admin.atualizar);
router.delete("/excluir/:id", validarAdmin, admin.excluir);
router.delete("/:id", validarAdmin, admin.excluir);
module.exports = router;
