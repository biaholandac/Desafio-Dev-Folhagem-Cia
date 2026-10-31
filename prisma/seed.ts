import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plantas = [
  { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 7 },
  { nome: "Calathea", especie: "Calathea orbifolia", preco: 6500, estoque: 5, luminosidade: "SOMBRA", petFriendly: true, regaACadaDias: 3 },
  { nome: "Zamioculca", especie: "Zamioculcas zamiifolia", preco: 4500, estoque: 8, luminosidade: "SOMBRA", petFriendly: false, regaACadaDias: 15 },
  { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 3200, estoque: 0, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 2 },
  { nome: "Cacto-bola", especie: "Echinocactus grusonii", preco: 2500, estoque: 20, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 21 },
  { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 3900, estoque: 0, luminosidade: "SOL_PLENO", petFriendly: false, regaACadaDias: 14 },
] as const;

const main = async () => {
  await prisma.planta.deleteMany();
  await prisma.planta.createMany({ data: [...plantas] });
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());