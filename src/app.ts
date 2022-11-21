import { Telegraf } from "telegraf";

import dotenv from 'dotenv';
dotenv.config();

import {
    getCia,
    getCias,
    getQuoteHotmilhas,
    getQuoteMaxmilhas
} from "./controllers/QuoteController";

import { ICompany } from "./interfaces/ICompany";
import { getUser, isRegistered } from "./controllers/UserController";
import { getService } from "./controllers/ServiceController";

const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.start(async (context) => {
    try {
        const from = context.update.message.from;

        await isRegistered(context.update.message.from);

        context.replyWithHTML(`
        Olá <b>${from.first_name}</b>! \n@SuasMilhasBot é o mais completo bot com cotações em tempo real das principais plaformas de venda de milhas do país!
        \nNo <b>plano Free</b> você tem direito a 5 solicitações de cotação para testar nosso bot.
        \nFaca uma recarga a partir de <b>R$4,99</b> e aumente o seu limite diario de solicitações, 🫵🏽 clique no botão <b>Recarregar.</b>
        `,
            {
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Iniciar Cotação',
                                callback_data: "cotar",
                            },
                        ],
                        [
                            {
                                text: 'Ver Conta / Limite',
                                callback_data: "conta",
                            }
                        ],
                        [
                            {
                                text: 'Recarregar',
                                callback_data: "recarregar",
                            },
                        ]
                    ]
                }
            });
    } catch (error) {
        console.log(error);
        context.replyWithHTML(`Desculpe, houve um erro ao iniciar o bot.`);
    }
});

bot.action('start', async (context) => {
    try {
        const from = context.update.callback_query.from;

        await isRegistered(context.update.callback_query.from);

        context.replyWithHTML(`
        Olá <b>${from.first_name}</b>! \n@SuasMilhasBot é o mais completo bot com cotações em tempo real das principais plaformas de venda de milhas do país!
        \nNo <b>plano Free</b> você tem direito a 5 solicitações de cotação para testar nosso bot.
        \nFaca uma recarga a partir de <b>R$4,99</b> e aumente o seu limite diario de solicitações, 🫵🏽 clique no botão <b>Recarregar.</b>        
        `,
            {
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Iniciar Cotação',
                                callback_data: "cotar",
                            },
                        ],
                        [
                            {
                                text: 'Ver Conta / Limite',
                                callback_data: "conta",
                            }
                        ],
                        [
                            {
                                text: 'Recarregar',
                                callback_data: "recarregar",
                            },
                        ]
                    ]
                }
            });
    } catch (error) {
        console.log(error);
        context.replyWithHTML(`Desculpe, houve um erro ao iniciar o bot.`);
    }
});

bot.action('cotar', async (context) => {
    try {

        context.sendChatAction("typing");

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
        console.log(error);
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
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado e veja os exemplos abaixo: 
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
                                        },
                                        {
                                            text: 'Voltar',
                                            callback_data: "start",
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
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado e veja os exemplos abaixo: 
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
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado e veja os exemplos abaixo: 
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
                context.sendMessage(`🚨 Para que sua cotação ocorra perfeitamente, respeite o limite mínimo e o máximo informado e veja os exemplos abaixo: 
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
                statusBot = false;
                break;
        }

    } catch (error) {
        console.log(error);
        context.sendChatAction('typing');
        context.sendMessage(`🚨 Desculpe, houve um erro ao processar sua solicitação.`);
    }

});

bot.command('conta', async (context) => {
    context.sendChatAction('typing');
    context.deleteMessage();

    const user = await getUser(context.update.message.from);

    context.sendMessage(`👤 Dados do Usuário
    \n🆔 | ID: ${user[0].userId}
    \n🫡 | Nome: ${user[0].first_name}\n💻 | Username: ${user[0].username}
    \n💎 | Membro Vip: ${user[0].is_Vip ? "Sim" : "Não"}\n🤑 | Saldo: ${user[0].balance}\n🔎 | Consultas: ${user[0].requests}
    `, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Voltar',
                        callback_data: "start",
                    },
                ]
            ], resize_keyboard: true, one_time_keyboard: true
        }
    });
});

bot.action('conta', async (context) => {
    context.sendChatAction('typing');

    const user = await getUser(context.update.callback_query.from);

    context.sendMessage(`👤 Dados do Usuário
    \n🆔 | ID: ${user[0].userId}
    \n🫡 | Nome: ${user[0].first_name}\n💻 | Username: ${user[0].username}
    \n💎 | Membro Vip: ${user[0].is_Vip ? "Sim" : "Não"}\n🤑 | Saldo: ${user[0].balance}\n🔎 | Consultas: ${user[0].requests}
    `, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Voltar',
                        callback_data: "start",
                    },
                ]
            ], resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

bot.command('recarregar', async (context) => {
    const services = await getService();

    context.replyWithHTML(`💵 Forma de pagamento: <b>PIX</b>
    \nPara dar início a sua recarga, por favor selecione um dos pacotes abaixo:`, {
        reply_markup: {
            inline_keyboard: services.map((service) => {
                return [
                    {
                        text: `💰 ${service.code} ${service.description} |  R$${service.price}`,
                        callback_data: service.code
                    }
                ]
            })
        }
    });
});

bot.action('recarregar', async (context) => {
    const services = await getService();

    context.replyWithHTML(`💵 Forma de pagamento: <b>PIX</b>
    \nPara dar início a sua recarga, por favor selecione um dos pacotes abaixo:`, {
        reply_markup: {
            inline_keyboard: services.map((service) => {
                return [
                    {
                        text: `💰 ${service.code} ${service.description} |  R$${service.price}`,
                        callback_data: service.code
                    }
                ]
            })
        }
    });
})

bot.launch();