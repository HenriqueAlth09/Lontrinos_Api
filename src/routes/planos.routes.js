const validarAdmin = require("../middlewares/validaAdmin");
const express = require("express");

const router = express.Router();

const { 
    cadastrar, 
    listar, 
    buscar, 
    atualizar, 
    excluir 
} = require("../controllers/planos.controller");

router.post("/cadastrar", validarAdmin, cadastrar);
router.get("/listar", listar);
router.get("/buscar/:id", buscar);
router.put("/atualizar/:id", validarAdmin, atualizar);
router.delete("/excluir/:id", validarAdmin, excluir);

module.exports = router;
