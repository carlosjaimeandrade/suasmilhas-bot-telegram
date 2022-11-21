import { prisma } from "../config/prisma";

export const getService = async () => {
    return await prisma.service.findMany({
        orderBy: {
            price: 'asc'
        }
    });
};

export const createService = async () => {

    await prisma.service.createMany({
        data: [
            {
                code: "SMBOT50",
                description: "PACOTE 50 SOLICITAÇÕES",
                price: 4.99,
                priceperUnit: 50
            },
            {
                code: "SMBOT100",
                description: "PACOTE 100 SOLICITAÇÕES",
                price: 9.99,
                priceperUnit: 100
            },
            {
                code: "SMBO150",
                description: "PACOTE 150 SOLICITAÇÕES",
                price: 14.99,
                priceperUnit: 150
            },
            {
                code: "SMBOT200",
                description: "PACOTE 200 SOLICITAÇÕES",
                price: 19.99,
                priceperUnit: 200
            },
            {
                code: "SMBOT250",
                description: "PACOTE 250 SOLICITAÇÕES",
                price: 24.99,
                priceperUnit: 250
            },
            {
                code: "SMBOT300",
                description: "PACOTE 300 SOLICITAÇÕES",
                price: 29.99,
                priceperUnit: 300
            }
        ]
    });
}