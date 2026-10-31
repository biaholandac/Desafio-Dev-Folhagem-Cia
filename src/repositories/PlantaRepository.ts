import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (
  filtros: Prisma.PlantaWhereInput,
  ordenacao?: Prisma.PlantaOrderByWithRelationInput
) => {
  return await prisma.planta.findMany({
    where: filtros,
    orderBy: ordenacao,
  });
};


export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

// Confere e diminui o estoque numa única operação no banco,
// para que duas vendas simultâneas nunca deixem o estoque negativo.
export const venderPlanta = async (id: number, quantidade: number) => {
    return await prisma.planta.updateMany({
        where: { id: id, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
};

// O Prisma não soma multiplicações de colunas, então a conta é feita no código.
export const calcularValorTotalEstoque = async () => {
    const plantas = await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });

    const valorTotalEmCentavos = plantas.reduce(
        (total, planta) => total + planta.preco * planta.estoque,
        0
    );

    const totalDeVasos = plantas.reduce(
        (total, planta) => total + planta.estoque,
        0
    );

    return { valorTotalEmCentavos, totalDeVasos };
};