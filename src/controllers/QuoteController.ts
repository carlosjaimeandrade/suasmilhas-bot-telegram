import http from "../config/axios";
import { ICompany } from "../interfaces/ICompany";

export const getCias = async () => {
    return await http.get('miles/company');
}

export const getCia = async (id: string) => {
    const cias = await getCias();
    return cias.data.companies.filter((company: ICompany) =>
        company.id == id).map((comp: ICompany) => {
            const newPoints: any[] = [];
            for (let index = comp.points[0]; index < comp.points[1]; index++) {
                newPoints.push(`${index}`);
            }
            return { ...comp, points: newPoints };
        });
}

export const getQuoteHotmilhas = async (id: string, quantity: string) => {

    const hot = await http.get(`/miles/${id}/${quantity}`);
    console.log(hot);

    return [
        {
            paymentDeadline: 1,
            cpm: hot.data.miles["1"] / parseInt(quantity),
            totalPrice: hot.data.miles["1"]
        },
        {
            paymentDeadline: 30,
            cpm: hot.data.miles["30"] / parseInt(quantity),
            totalPrice: hot.data.miles["30"]
        },
        {
            paymentDeadline: 60,
            cpm: hot.data.miles["60"] / parseInt(quantity),
            totalPrice: hot.data.miles["60"]
        },
        {
            paymentDeadline: 90,
            cpm: hot.data.miles["90"] / parseInt(quantity),
            totalPrice: hot.data.miles["90"]
        },
        {
            paymentDeadline: 120,
            cpm: hot.data.miles["120"] / parseInt(quantity),
            totalPrice: hot.data.miles["120"]
        },
        {
            paymentDeadline: 150,
            cpm: hot.data.miles["150"] / parseInt(quantity),
            totalPrice: hot.data.miles["150"]
        },
    ];
};

export const getQuoteMaxmilhas = async (id: string, quantity: string) => {

    let maxID;

    switch (id) {
        case "1":
            maxID = "gol";
            break;
        case "2":
            maxID = "latam";
            break;
        case "3":
            maxID = "azul";
            break;
        case "8":
            maxID = "latam";
            break;
        default:
            maxID = id;
            break;
    }

    const requestMaxmilhas = await http.get(`https://bff-mall.maxmilhas.com.br/v2/hangar/miles/modality-card-info/${maxID}/${quantity}000`);
    console.log(requestMaxmilhas);

    return requestMaxmilhas.data.modalityCards.paymentScheduled.map((quote: any) => {
        return {
            paymentDeadline: quote.paymentDeadline,
            cpm: quote.price,
            totalPrice: quote.totalPrice
        }
    });
};