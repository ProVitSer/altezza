'use strict';
const axios = require('axios'),
    logger = require(`./logger/logger`),
    config = require(`./config/config`);

class Telegram {
    constructor(url = config.webServer.url) {
        this.url = url;
    }

    async sendInfoToTelegram(...params) {
        logger.info(`Отправляем данные  ${params}`);

        let config = {
            headers: {
                'User-Agent': 'voipnotes/0.0.1',
                'Content-Type': 'application/json',
            }
        }

        let sendJson = {
            "from": params[0],
            "to": params[1],
	    "manager" : params[2],
            "callType": params[3],
            "status": params[4],
            "time": params[5],
	    "billsec" : params[6],
            "recordingUrl": params[7]
        }
	let data = JSON.stringify(sendJson)

        logger.info(`Отправляем запрос ${data}`);
        const res = await axios.post(this.url,data,config)
        const result = await res;

        logger.info(`Получили результат на запрос ${result.data}`);
        if (!result) {
            logger.error('Отсутствует результат');
            return [];
        }
        return result.data;
    };
};

module.exports = Telegram;
