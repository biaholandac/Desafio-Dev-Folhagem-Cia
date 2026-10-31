import { Request, Response } from "express";
import { Luminosidade, Prisma } from "@prisma/client";
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

  if (dados.especie !== undefined && (typeof dados.especie !== "string" || dados.especie.trim() === "")) {
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

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome } = req.query;
    const filtros: Prisma.PlantaWhereInput = {};

    if (luminosidade !== undefined) {
      if (!LUMINOSIDADES.includes(luminosidade as Luminosidade)) {
        return res.status(400).json({
          message: `O filtro luminosidade deve ser um destes valores: ${LUMINOSIDADES.join(", ")}.`,
        });
      }
      filtros.luminosidade = luminosidade as Luminosidade;
    }

    if (petFriendly !== undefined) {
      if (petFriendly !== "true" && petFriendly !== "false") {
        return res.status(400).json({ message: "O filtro petFriendly deve ser true ou false." });
      }
      filtros.petFriendly = petFriendly === "true";
    }

    if (nome !== undefined){
      if (typeof nome !== "string" || nome.trim() === ""){
        return res.status(400).json({message: "O filtro nome deve ser um texto não vazio."})
      }
      filtros.nome = { contains: nome.trim(), mode: "insensitive" };
    }
    
    const plantas = await PlantaRepository.findAllPlantas(filtros);

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas." });
  }
};

export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantasEsgotadas = await PlantaRepository.findAllPlantas({ estoque: 0 });

    return res.status(200).json(plantasEsgotadas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas esgotadas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    // O id chega da URL como texto, então lerId converte e confere se é um inteiro positivo
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    // 404 Not Found: o id não existe
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantaRepository.deletePlanta(id);

    // 204 No Content: deu certo e não há nada para devolver
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const algumCampo = CAMPOS.some((campo) => req.body[campo] !== undefined);
    if (!algumCampo) {
      return res.status(400).json({ message: "Envie pelo menos um campo para editar." });
    }

    const erro = validarPlanta(req.body, true);
    if (erro) {
      return res.status(400).json({ message: erro });
    }

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // editar só os campos enviados
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) {
      return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
    }

    const { quantidade } = req.body;
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      return res.status(400).json({ message: "O campo quantidade deve ser um número inteiro maior ou igual a 1." });
    }

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    // A conferência e a baixa acontecem em uma única operação no banco
    const resultado = await PlantaRepository.venderPlanta(id, quantidade);
    if (resultado.count === 0) {
      return res.status(400).json({ message: "Estoque insuficiente para essa venda." });
    }

    const plantaAtualizada = await PlantaRepository.findPlantaById(id);

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const valorTotal = await PlantaRepository.calcularValorTotalEstoque();

    return res.status(200).json(valorTotal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular o valor do estoque." });
  }
};