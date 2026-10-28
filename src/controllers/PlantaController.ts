import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const LUMINOSIDADES = Object.values(Luminosidade);

const lerId = (valor: string): number | null => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const CAMPOS = ["nome", "especie", "preco", "estoque", "luminosidade", "petFriendly", "regaACadaDias"];

const validarPlanta = (dados: any, edicao: boolean): string | null => {
  if (!edicao) {
    const faltando = CAMPOS.filter((campo) => dados[campo] === undefined);
    if (faltando.length > 0) {
      return `Campos obrigatórios faltando: ${faltando.join(", ")}.`;
    }
  }

  // se a informacao esta errada, devolve uma mensagem explicando o erro
  if (dados.nome !== undefined && (typeof dados.nome !== "string" || dados.nome.trim() === "")) {
    return "O campo nome deve ser um texto não vazio.";
  }

  if (dados.preco !== undefined && (!Number.isInteger(dados.preco) || dados.preco <= 0)) {
    return "O campo preco deve ser um número inteiro maior que zero (em centavos).";
  }

  if (dados.especie !== undefined && (typeof dados.especie !== "string" || dados.especie.trim() === "")){
    return "O campo especie deve ser um texto não vazio.";
  }

  if (dados.estoque !== undefined && (!Number.isInteger(dados.estoque) || dados.estoque < 0)) {
    return "O campo estoque deve ser um número inteiro maior ou igual a zero.";
  }

  if (dados.regaACadaDias !== undefined && (!Number.isInteger(dados.regaACadaDias) || dados.regaACadaDias < 1)) {
    return "O campo regaACadaDias deve ser um número inteiro maior ou igual a um.";
  }

  if (dados.luminosidade !== undefined && !LUMINOSIDADES.includes(dados.luminosidade)) {
    return `O campo luminosidade deve ser um destes valores: ${LUMINOSIDADES.join(", ")}.`;
  }

  if (dados.petFriendly !== undefined && typeof dados.petFriendly !== "boolean") {
    return "O campo petFriendly deve ser true ou false.";
  }
  
  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const erro = validarPlanta(req.body, false);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const planta = await PlantaRepository.createPlanta({
      nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};



