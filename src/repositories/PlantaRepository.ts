import { Prisma } from "@prisma/client";
import prisma from "@database";

// se baseando no modelo do User, trocar as funcoes de User para Plantas

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (filtros: Prisma.PlantaWhereInput) => {
    return await prisma.planta.findMany({
        where: filtros,
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


export const venderPlanta = async (id: number, quantidade: number) => {
    return await prisma.planta.updateMany({
        where: { id: id, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
};

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