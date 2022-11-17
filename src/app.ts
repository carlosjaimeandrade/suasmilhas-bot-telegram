import { Telegraf, Context } from "telegraf";

import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN as string);

bot.start(async (content) => {
    const from = content.update.message.from;
    content.replyWithHTML(`
        Olá <b>${from.first_name}</b>! \n@SuasMilhasBot é o mais completo bot com cotações em tempo real das principais plaformas de venda de milhas do pais!
        \nNo <b>plano Free</b> você tem direito a 2 solicitações por dia.
        \nAo se tornar um <b>membro VIP</b> você terá um limite maior de solicitações por dia, temos planos a partir de <b>R$5,00 mensais</b>.        
        \n<a href="www.suasmilhas.com">Assine um plano<b> Clicando Aqui</b></a> 
    `, { disable_web_page_preview: true });
});

bot.launch();