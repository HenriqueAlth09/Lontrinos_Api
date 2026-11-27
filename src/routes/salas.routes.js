const validarAdmin = require("../middlewares/validaAdmin");
const express = require("express");

const router = express.Router();

const {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
} = require("../controllers/salas.controller");

router.get("/", listar);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);

router.post("/cadastrar", validarAdmin, cadastrar);
router.put("/atualizar/:id", validarAdmin, atualizar);
router.delete("/excluir/:id", validarAdmin, excluir);

module.exports = router;
