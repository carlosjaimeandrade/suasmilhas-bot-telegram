import { IUser } from "../interfaces/IUser";
import { prisma } from "../config/prisma";

export const isRegistered = async (user: IUser) => {

    const check = await prisma?.user.findMany({ where: { userId: user.id } });

    if (check && check.length <= 0) {

        await prisma?.user.create({
            data: {
                userId: user.id,
                first_name: user.first_name,
                username: "user.username",
                language: user.language_code,
                balance: 0,
                requests: 0
            }
        });
    }
}

export const getUser = async (user: IUser) => {
    return await prisma?.user.findMany({
        where: {
            userId: user.id
        }
    });
}