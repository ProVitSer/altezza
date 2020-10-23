"use strict";
const moment = require('moment'),
    nami = require(`./models/ami`),
    db = require(`./models/db`),
    logger = require(`./logger/logger`),
    appConfig = require(`./config/config`),
    Telegram = require('./telegram');

const telegram = new Telegram;
let checkVoicemail = true;
let checkCDR = true;


const funcCheckVoicemail = () => {
    checkVoicemail = true;
};

const funcCDR = () => {
    checkCDR = true;
};

const replaceChannel = (channel) => {
    return channel.replace(/(PJSIP\/)(.*)-(.*)/, `$2`);
};

const searchVoicemail = (uniqueid,voicemailURL) => {
    db.query('select did,src,calldate,channel,billsec from cdr where uniqueid like "' + uniqueid + '" and lastapp like "VoiceMail"', (err, result, fields) => {
        if (err) logger.error(err);
	logger.info(result)
        if (result.length != 0) {
                let calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
                let incomingNumber = result[0].src;
                let recordPath = voicemailURL.replace(/\/var\/spool\/asterisk/g, "http://195.2.84.33/voicemail");
                let billsec = result[0].billsec;
               	let channel = replaceChannel(result[0].channel);
                let did = appConfig.sipTrunkNumber[result[0].did];
		let direction = "Incoming";
		let callStatus = "Voicemail";
                telegram.sendInfoToTelegram(incomingNumber,did,channel,direction,callStatus,calldate,billsec,recordPath + '.wav')
                //telegram.sendInfoToTelegram(incomingNumber,did,calldate,recordPath + '.wav')
        } else {
            logger.debug(`Результат ${util.inspect(result)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    });
}

const searchIncomingCallInfoInCdr = (uniqueid) => {
    db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where uniqueid like  "' + uniqueid + '" ORDER BY billsec', (err, result, fields) => {
	logger.info(result)
        if (err) logger.error(err);
        if (result.length != 0) {
                let calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
                let incomingNumber = result[0].src;
                let recordPath = moment().format("YYYY/MM/DD/");
                let recordFile = result[0].recordingfile;
	        let billsec = result[0].billsec;
		let dstchannel = replaceChannel(result[0].dstchannel);
                let did = appConfig.sipTrunkNumber[result[0].did];
                let direction = "Incoming";
                let callStatus = appConfig.crmIncomingStatus[result[0].disposition];
                telegram.sendInfoToTelegram(incomingNumber,did,dstchannel,direction,callStatus,calldate,billsec,"http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile)
        } else {
            logger.debug(`Результат ${util.inspect(result)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    });
}

const searchOutgoingCallInfoInCdr = (uniqueid) => {
    db.query('select calldate,src,dst,disposition,billsec,recordingfile  from cdr where uniqueid like  "' + uniqueid + '" and dcontext like "from-internal"', (err, result, fields) => {
        if (err) logger.error(err);
        logger.info(result)
        if (result[0]) {
            let calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            let outgoingNumber = result[0].src;
            let recordPath = moment().format("YYYY/MM/DD/");
            let recordFile = result[0].recordingfile
	    let billsec = result[0].billsec;
            let calledNumber = result[0].dst;
            let direction = "Outgoing";
            let callStatus = appConfig.crmIncomingStatus[result[0].disposition];
            telegram.sendInfoToTelegram(outgoingNumber,calledNumber,outgoingNumber,direction,callStatus,calldate,billsec,"http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile)
        } else {
            logger.debug(`Результат ${util.inspect(result)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    });
}


const searchIncomingFollowMeInCdr = (uniqueid,followMeNumber) => {
    db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where disposition like "ANSWERED" and  uniqueid like  "' + uniqueid + '" ORDER BY billsec', (err, result, fields) => {
        logger.info(result);
        if (err) logger.error(err);
        if (result.length != 0) {
                let calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
                let incomingNumber = result[0].src;
                let recordPath = moment().format("YYYY/MM/DD/");
                let recordFile = result[0].recordingfile;
                let billsec = result[0].billsec;
                let dstchannel = followMeNumber;
                let did = appConfig.sipTrunkNumber[result[0].did];
                let direction = "Incoming";
                let callStatus = appConfig.crmIncomingStatus[result[0].disposition];
                telegram.sendInfoToTelegram(incomingNumber,did,dstchannel,direction,callStatus,calldate,billsec,"http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile)
        } else {
            //logger.debug(`Результат ${util.inspect(result)}`);
            //logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
	       searchNotAnswerFollowMeInCdr(uniqueid,followMeNumber);
        }
    });
}

const searchNotAnswerFollowMeInCdr = (uniqueid,followMeNumber) => {
    db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where uniqueid like  "' + uniqueid + '" ORDER BY billsec', (err, result, fields) => {
        logger.info(result);
        if (err) logger.error(err);
        if (result.length != 0) {
                let calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
                let incomingNumber = result[0].src;
                let recordPath = moment().format("YYYY/MM/DD/");
                let recordFile = result[0].recordingfile;
                let billsec = result[0].billsec;
                let dstchannel = followMeNumber;
                let did = appConfig.sipTrunkNumber[result[0].did];
                let direction = "Incoming";
                let callStatus = appConfig.crmIncomingStatus[result[0].disposition];
                telegram.sendInfoToTelegram(incomingNumber,did,dstchannel,direction,callStatus,calldate,billsec,"http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile)
        } else {
            logger.debug(`Результат ${util.inspect(result)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    });
}


nami.on(`namiEventVarSet`, (event) => {
//logger.info(event);
    if (checkVoicemail &&
	event.calleridnum &&
        event.calleridnum.toString().length > 4 &&
        event.context == `app-vmblast` &&
        event.variable == 'VM_MESSAGEFILE'
    ) {
        logger.debug(`Получили Voicemail ${event}, производим поиск`);
        checkVoicemail = false;
        setTimeout(funcCheckVoicemail, 1000);
        setTimeout(searchVoicemail, 10000, event.uniqueid,event.value);
    }
})

nami.on(`namiEventNewexten`, (event) => {
//logger.info(event);
    if (checkCDR && event.calleridnum.toString().length > 4 &&
        event.uniqueid == event.linkedid &&
        event.connectedlinenum.toString().length < 4 &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
        logger.debug(`Завершился входящий вызов ${event}, производим поиск`);
        checkCDR = false;
        setTimeout(funcCDR, 1000);
        setTimeout(searchIncomingCallInfoInCdr, 10000, event.uniqueid);
    }
    if (checkCDR && event.calleridnum.toString().length < 4 &&
        event.connectedlinenum.toString().length > 10 &&
        event.uniqueid == event.linkedid &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
        logger.debug(`Завершился исходящий вызов ${event}, производим поиск`);
        checkCDR = false;
        setTimeout(funcCDR, 1000);
        setTimeout(searchOutgoingCallInfoInCdr, 10000, event.uniqueid);
    }
    if (checkCDR && event.calleridnum.toString().length > 4 &&
        event.uniqueid == event.linkedid &&
        event.connectedlinenum.toString().length > 4 &&
        event.context == 'macro-hangupcall' &&
        event.application == 'Hangup'
    ) {
       	logger.debug(`Завершился входящий вызов с переадресацией ${event}, производим поиск`);
        checkCDR = false;
        let followMeNumber = event.connectedlinenum
        setTimeout(funcCDR, 1000);
        setTimeout(searchIncomingFollowMeInCdr, 10000, event.uniqueid,followMeNumber);
    }
});



nami.on(`namiEvent`, (event) => {
   // console.log(event);
});


