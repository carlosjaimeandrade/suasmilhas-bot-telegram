import { Telegraf } from "telegraf";
import http from "./helpers/axios";

import dotenv from 'dotenv';
import { ICompany } from "./interfaces/ICompany";
dotenv.config();

const getCias = async () => {
    try {

        return await http.get('miles/company');

    } catch (error) {
        throw new Error('Erro ao buscar cias');
    }
}

const getCia = async (id: string) => {
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

const getQuoteHotmilhas = async (id: string, quantity: string) => {

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

const getQuoteMaxmilhas = async (id: string, quantity: string) => {

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

const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.start(async (content) => {

    const from = content.update.message.from;

    content.replyWithHTML(`
        Olá <b>${from.first_name}</b>! \n@SuasMilhasBot é o mais completo bot com cotações em tempo real das principais plaformas de venda de milhas do país!
        \nNo <b>plano Free</b> você tem direito a 2 solicitações por dia.
        \nAo se tornar um <b>membro VIP</b> você terá solicitações ilimitadas, torne-se um membro por apenas <b>R$8,99 mensais</b>.`,
        {
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Iniciar Cotação',
                            callback_data: "cotar",
                        },
                        {
                            text: 'Torna-se VIP',
                            url: 'https://suasmilhas.com/assinar'
                        }
                    ]
                ]
            }
        });
});

bot.action('cotar', async (context) => {
    try {

        bot.telegram.sendChatAction(`${context.chat?.id}`, "typing");

        const cias = await getCias();
        const user = context.update.callback_query.from.first_name;
        const type = context.update.callback_query.data;

        if (!type) {
            throw new Error("Invalid type");
        }

        context.replyWithHTML(`✈️ <b>${user}</b>, selecione uma campanhia aérea:`, {
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: cias.data.companies.map((cia: ICompany) => {
                    return [{
                        text: cia.category ? "LATAM PLATINUM/BLACK" : cia.name,
                        callback_data: `${cia.id}`
                    }]
                }),
                one_time_keyboard: true,
                resize_keyboard: true,
                input_field_placeholder: "Selecione uma cia",
            }
        });

        context.answerCbQuery(`Você selecionou ${type}`);

    } catch (error) {
        context.replyWithHTML(`Desculpe, houve um erro ao processar sua solicitação.`);
    }
});

bot.action(['1', '2', '3', '8'], async (context) => {

    try {

        let statusBot = false;
        context.sendChatAction("typing");        

        switch (context.match[0]) {

            case '1':
                statusBot = true;
                const ciaID = context.match[0];
                context.sendChatAction("typing");

                const company = await getCia(ciaID);
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado abaixo e veja os exemplos abaixo: 
                \nLimites\n🔴 ├  MIN ${company[0].points[0]}K\n🟢 ├  MAX ${company[0].points[company[0].points.length - 1]}K
                \nExemplos\n🫵🏽 | Tenho 65K Digite: 50\n🫵🏽 | Tenho 100K Digite: 100
                \nDigite o total de milhas: [${company[0].points[0]} - ${company[0].points[company[0].points.length - 1]}]`);

                bot.hears(company[0].points, async (context) => {
                    if (statusBot) {

                        context.sendMessage("🤑 aguarde, estamos calculando...");

                        const quoteHotmilhas = await getQuoteHotmilhas(ciaID, context.match[0]);
                        const quoteMaxmilhas = await getQuoteMaxmilhas(ciaID, context.match[0]);                        
                        context.sendChatAction("typing");
                        context.replyWithHTML(`
                        ✈️ | Companhia Aérea: <b>Smiles</b>\n💵 | Plaforma: <b>HotMilhas</b>
                        \n💰 ├ Em 01 dia <b>${quoteHotmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 30 dias <b>${quoteHotmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 60 dias <b>${quoteHotmilhas[2].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[2].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 90 dias <b>${quoteHotmilhas[3].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[3].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 120 dias <b>${quoteHotmilhas[4].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[4].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 150 dias <b>${quoteHotmilhas[5].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[5].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        
                        \n✈️ | Companhia Aérea: <b>Smiles</b>\n💵 | Plaforma: <b>MaxMilhas</b>\n${quoteMaxmilhas[0] && quoteMaxmilhas[0].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[0].paymentDeadline} dias <b>${quoteMaxmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}\n${quoteMaxmilhas[1] && quoteMaxmilhas[1].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[1].paymentDeadline} dias <b>${quoteMaxmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}
                        `, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Iniciar Nova Cotação',
                                            callback_data: "cotar",
                                        }
                                    ]
                                ], resize_keyboard: true
                            }
                        });
                    }
                    statusBot = false;
                });                
                break;

            case '2':
                statusBot = true;
                const ciaID2 = context.match[0];
                context.sendChatAction("typing");

                const company2 = await getCia(ciaID2);
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado abaixo e veja os exemplos abaixo: 
                \nLimites\n🔴 ├  MIN ${company2[0].points[0]}K\n🟢 ├  MAX ${company2[0].points[company2[0].points.length - 1]}K
                \nExemplos\n🫵🏽 | Tenho 65K Digite: 50\n🫵🏽 | Tenho 100K Digite: 100
                \nDigite o total de milhas: [${company2[0].points[0]} - ${company2[0].points[company2[0].points.length - 1]}]`);

                bot.hears(company2[0].points, async (context) => {
                    if (statusBot) {

                        context.sendMessage("🤑 aguarde, estamos calculando...");

                        const quoteHotmilhas = await getQuoteHotmilhas(ciaID2, context.match[0]);
                        const quoteMaxmilhas = await getQuoteMaxmilhas(ciaID2, context.match[0]);

                        context.sendChatAction("typing");
                        context.replyWithHTML(`
                        ✈️ | Companhia Aérea: <b>Latam</b>\n💵 | Plaforma: <b>HotMilhas</b>
                        \n💰 ├ Em 01 dia <b>${quoteHotmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 30 dias <b>${quoteHotmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 60 dias <b>${quoteHotmilhas[2].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[2].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 90 dias <b>${quoteHotmilhas[3].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[3].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 120 dias <b>${quoteHotmilhas[4].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[4].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 150 dias <b>${quoteHotmilhas[5].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[5].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        
                        \n✈️ | Companhia Aérea: <b>Latam</b>\n💵 | Plaforma: <b>MaxMilhas</b>\n${quoteMaxmilhas[0] && quoteMaxmilhas[0].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[0].paymentDeadline} dias <b>${quoteMaxmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}\n${quoteMaxmilhas[1] && quoteMaxmilhas[1].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[1].paymentDeadline} dias <b>${quoteMaxmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}
                        `, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Iniciar Nova Cotação',
                                            callback_data: "cotar",
                                        }
                                    ]
                                ], resize_keyboard: true
                            }
                        });
                    }
                    statusBot = false;
                });
                break;

            case '3':
                statusBot = true;
                const ciaID3 = context.match[0];
                context.sendChatAction("typing");

                const company3 = await getCia(ciaID3);
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado abaixo e veja os exemplos abaixo: 
                \nLimites\n🔴 ├  MIN ${company3[0].points[0]}K\n🟢 ├  MAX ${company3[0].points[company3[0].points.length - 1]}K
                \nExemplos\n🫵🏽 | Tenho 65K Digite: 50\n🫵🏽 | Tenho 100K Digite: 100
                \nDigite o total de milhas: [${company3[0].points[0]} - ${company3[0].points[company3[0].points.length - 1]}]`);

                bot.hears(company3[0].points, async (context) => {
                    if (statusBot) {

                        context.sendMessage("🤑 aguarde, estamos calculando...");

                        const quoteHotmilhas = await getQuoteHotmilhas(ciaID3, context.match[0]);
                        const quoteMaxmilhas = await getQuoteMaxmilhas(ciaID3, context.match[0]);

                        context.sendChatAction("typing");
                        context.replyWithHTML(`
                        ✈️ | Companhia Aérea: <b>TudoAzul</b>\n💵 | Plaforma: <b>HotMilhas</b>
                        \n💰 ├ Em 01 dia <b>${quoteHotmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 30 dias <b>${quoteHotmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 60 dias <b>${quoteHotmilhas[2].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[2].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 90 dias <b>${quoteHotmilhas[3].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[3].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 120 dias <b>${quoteHotmilhas[4].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[4].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 150 dias <b>${quoteHotmilhas[5].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[5].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        
                        \n✈️ | Companhia Aérea: <b>TudoAzul</b>\n💵 | Plaforma: <b>MaxMilhas</b>\n${quoteMaxmilhas[0] && quoteMaxmilhas[0].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[0].paymentDeadline} dias <b>${quoteMaxmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}\n${quoteMaxmilhas[1] && quoteMaxmilhas[1].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[1].paymentDeadline} dias <b>${quoteMaxmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}
                        `, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Iniciar Nova Cotação',
                                            callback_data: "cotar",
                                        }
                                    ]
                                ], resize_keyboard: true
                            }
                        });
                    }
                    statusBot = false;
                });
                break;

            case '8':
                statusBot = true;
                const ciaID4 = context.match[0];
                context.sendChatAction("typing");

                const company4 = await getCia(ciaID4);
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado abaixo e veja os exemplos abaixo: 
                \nLimites\n🔴 ├  MIN ${company4[0].points[0]}K\n🟢 ├  MAX ${company4[0].points[company4[0].points.length - 1]}K
                \nExemplos\n🫵🏽 | Tenho 65K Digite: 50\n🫵🏽 | Tenho 100K Digite: 100
                \nDigite o total de milhas: [${company4[0].points[0]} - ${company4[0].points[company4[0].points.length - 1]}]`);

                bot.hears(company4[0].points, async (context) => {
                    if (statusBot) {

                        context.sendMessage("🤑 aguarde, estamos calculando...");

                        const quoteHotmilhas = await getQuoteHotmilhas(ciaID4, context.match[0]);
                        const quoteMaxmilhas = await getQuoteMaxmilhas(ciaID4, context.match[0]);

                        context.sendChatAction("typing");
                        context.replyWithHTML(`
                        ✈️ | Companhia Aérea: <b>Latam Planitum/Black</b>\n💵 | Plaforma: <b>HotMilhas</b>
                        \n💰 ├ Em 01 dia <b>${quoteHotmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 30 dias <b>${quoteHotmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 60 dias <b>${quoteHotmilhas[2].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[2].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 90 dias <b>${quoteHotmilhas[3].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[3].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 120 dias <b>${quoteHotmilhas[4].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[4].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        \n💰 ├ Em 150 dias <b>${quoteHotmilhas[5].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[5].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>
                        
                        \n✈️ | Companhia Aérea: <b>Latam Planitum/Black</b>\n💵 | Plaforma: <b>MaxMilhas</b>\n${quoteMaxmilhas[0] && quoteMaxmilhas[0].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[0].paymentDeadline} dias <b>${quoteMaxmilhas[0].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[0].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}\n${quoteMaxmilhas[1] && quoteMaxmilhas[1].totalPrice ? `\n💰 ├ Em ${quoteMaxmilhas[1].paymentDeadline} dias <b>${quoteMaxmilhas[1].totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>\n📊 ├ CPM <b>${quoteHotmilhas[1].cpm.toLocaleString("pt-BR", { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}</b>` : `\n💰 ├ MaxMilhas - <b>Indisponivel</b>`}
                        `, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Iniciar Nova Cotação',
                                            callback_data: "cotar",
                                        }
                                    ]
                                ], resize_keyboard: true
                            }
                        });
                    }
                    statusBot = false;
                });
                break;

            default:
                context.replyWithHTML(`🫣<b>Desculpe ${context.from?.first_name}</b>, houve um erro ao processar sua solicitação, tente novamente.`);
                break;
        }        

    } catch (error) {
        context.sendChatAction('typing');
        context.sendMessage(`🚨 Desculpe, houve um erro ao processar sua solicitação.`);
    }

});

bot.launch();