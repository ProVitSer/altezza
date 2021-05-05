"use strict";
const moment = require('moment'),
    nami = require(`./models/ami`),
    logger = require(`./logger/logger`),
    appConfig = require(`./config/config`),
    Axios = require('./src/axios'),
    db = require('./src/db');

const axios = new Axios;
let checkVoicemail = true;
let checkCDR = true;


const funCheckVoicemail = () => {
    checkVoicemail = true;
};

const funCheckCDR = () => {
    checkCDR = true;
};


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sleep(fn, time, ...args) {
    await timeout(time);
    return fn(...args);
}

//Производим поиск в БД информации по входящему вызову в зависимости от результата завершения(Успешный выходящий,голосовая почта,переадресация по правилам followme)
async function incomingCall(type, ...args) {
    try {
        let result;
        if (type == 'incoming') {
            result = await sleep(db.searchIncomingCallInfoInCdr, 10000, args[0]);
        } else if (type == 'followme') {
            result = await sleep(db.searchIncomingFollowMeInCdr, 10000, args[0], args[1]);
        } else {
            result = await sleep(db.searchVoicemail, 10000, args[0], args[1]);
        }
        const { incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordURL } = result;
        await axios.sendInfoToTelegram(incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordURL);
        return '';
    } catch (e) {
        logger.error(e);
    }
}

//Производим поиск в БД информации по исходящему вызову и отправляем на сервер для отправки в Telegram
async function outgoingCall(uniqueid) {
    try {
        const { outgoingNumber, calledNumber, direction, callStatus, calldate, billsec, recordURL } = await sleep(db.searchOutgoingCallInfoInCdr, 10000, uniqueid);
        axios.sendInfoToTelegram(outgoingNumber, calledNumber, outgoingNumber, direction, callStatus, calldate, billsec, recordURL);
    } catch (e) {
        logger.error(e);
    }
}

//Ловим событие получение голосовой почты
nami.on(`namiEventVarSet`, (event) => {
    if (checkVoicemail &&
        event.calleridnum &&
        event.calleridnum.toString().length > 4 &&
        event.context == `app-vmblast` && //Контекст голосовой почты
        event.variable == 'VM_MESSAGEFILE' //Значение, что оставили голосовое сообщение
    ) {
        logger.debug(`Получили Voicemail ${event}, производим поиск`);
        checkVoicemail = false; //По событию приходит 2 одинаковых event, чекаем
        setTimeout(funCheckVoicemail, 1000);
        incomingCall('voicemail', event.uniqueid, event.value);
    }
})

//Ловим события по входящему,исходящему вызову и переадресациям
nami.on(`namiEventNewexten`, (event) => {
    if (checkCDR && event.calleridnum.toString().length > 4 &&
        event.uniqueid == event.linkedid &&
        event.connectedlinenum.toString().length < 4 &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
        logger.debug(`Завершился входящий вызов ${event}, производим поиск`);
        checkCDR = false;
        setTimeout(funCheckCDR, 1000);
        incomingCall('incoming', event.uniqueid);
    }
    if (checkCDR && event.calleridnum.toString().length < 4 &&
        event.connectedlinenum.toString().length > 10 &&
        event.uniqueid == event.linkedid &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
        logger.debug(`Завершился исходящий вызов ${event}, производим поиск`);
        checkCDR = false;
        setTimeout(funCheckCDR, 1000);
        outgoingCall(event.uniqueid);
    }
    if (checkCDR && event.calleridnum.toString().length > 4 &&
        event.uniqueid == event.linkedid &&
        event.connectedlinenum.toString().length > 4 &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
        logger.debug(`Завершился входящий вызов с переадресацией ${event}, производим поиск`);
        checkCDR = false;
        setTimeout(funCheckCDR, 1000);
        incomingCall('followme', event.uniqueid, event.connectedlinenum);
    }
});


//Включить для вывода всех Event Asterisk
/*
nami.on(`namiEvent`, (event) => {
    logger.info(event);
});
*/