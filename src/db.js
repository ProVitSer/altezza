"use strict";
const moment = require('moment'),
    db = require('../models/db'),
    logger = require('../logger/logger'),
    appConfig = require(`../config/config`),
    util = require('util');

const replaceChannel = (channel) => {
    return channel.replace(/(PJSIP\/)(.*)-(.*)/, `$2`);
};


async function searchVoicemail(uniqueid, voicemailURL) {
    try {
        const resultSearchVoicemailInfo = await db.query('select did,src,calldate,channel,billsec from cdr where uniqueid like "' + uniqueid + '" and lastapp like "VoiceMail"');
        logger.info(`searchVoicemail ${util.inspect(resultSearchVoicemailInfo)}`);
        if (resultSearchVoicemailInfo.length != 0) {
            const calldate = moment(resultSearchVoicemailInfo[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            const incomingNumber = resultSearchVoicemailInfo[0].src;
            const recordPath = voicemailURL.replace(/\/var\/spool\/asterisk/g, "http://185.69.154.243/voicemail");
            const billsec = resultSearchVoicemailInfo[0].billsec;
            const dstchannel = replaceChannel(resultSearchVoicemailInfo[0].channel);
            const did = appConfig.sipTrunkNumber[resultSearchVoicemailInfo[0].did];
            const direction = "Incoming";
            const callStatus = "Voicemail";
            return { incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordPath };
        } else {
            logger.debug(`Результат searchVoicemail ${util.inspect(resultSearchVoicemailInfo)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    } catch (e) {
        return e;
    }
}


async function searchIncomingCallInfoInCdr(uniqueid) {
    try {
        const resultSearchIncomingCallInfo = await db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where uniqueid like  "' + uniqueid + '" ORDER BY billsec');
        logger.info(`searchIncomingCallInfoInCdr ${util.inspect(resultSearchIncomingCallInfo)}`);
        if (resultSearchIncomingCallInfo.length != 0) {
            const calldate = moment(resultSearchIncomingCallInfo[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            const incomingNumber = resultSearchIncomingCallInfo[0].src;
            const recordPath = moment().format("YYYY/MM/DD/");
            const recordFile = resultSearchIncomingCallInfo[0].recordingfile;
            const billsec = resultSearchIncomingCallInfo[0].billsec;
            const dstchannel = replaceChannel(resultSearchIncomingCallInfo[0].dstchannel);
            const did = appConfig.sipTrunkNumber[resultSearchIncomingCallInfo[0].did];
            const direction = "Incoming";
            const callStatus = appConfig.crmIncomingStatus[resultSearchIncomingCallInfo[0].disposition];
            const recordURL = "http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile;
            return { incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordURL };
        } else {
            logger.debug(`Результат searchIncomingCallInfoInCdr ${util.inspect(resultSearchIncomingCallInfo)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    } catch (e) {
        return e;
    }
}

async function searchOutgoingCallInfoInCdr(uniqueid) {
    try {
        const resultSearchOutgoingCallInfo = await db.query('select calldate,src,dst,disposition,billsec,recordingfile  from cdr where uniqueid like  "' + uniqueid + '" and dcontext like "from-internal"');
        if (resultSearchOutgoingCallInfo[0]) {
            const calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            const outgoingNumber = result[0].src;
            const recordPath = moment().format("YYYY/MM/DD/");
            const recordFile = result[0].recordingfile
            const billsec = result[0].billsec;
            const calledNumber = result[0].dst;
            const direction = "Outgoing";
            const callStatus = appConfig.crmIncomingStatus[result[0].disposition];
            const recordURL = "http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile;
            return { outgoingNumber, calledNumber, direction, callStatus, calldate, billsec, recordURL };

        } else {
            logger.debug(`Результат searchOutgoingCallInfoInCdr ${util.inspect(resultSearchIncomingCallInfo)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    } catch (e) {
        return e;

    }
}

async function searchIncomingFollowMeInCdr(uniqueid, followMeNumber) {
    try {
        const resultSearcFolowMeCallInfo = await db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where disposition like "ANSWERED" and  uniqueid like  "' + uniqueid + '" ORDER BY billsec');
        if (resultSearcFolowMeCallInfo.length != 0) {
            const calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            const incomingNumber = result[0].src;
            const recordPath = moment().format("YYYY/MM/DD/");
            const recordFile = result[0].recordingfile;
            const billsec = result[0].billsec;
            const dstchannel = followMeNumber;
            const did = appConfig.sipTrunkNumber[result[0].did];
            const direction = "Incoming";
            const callStatus = appConfig.crmIncomingStatus[result[0].disposition];
            const recordURL = "http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile;
            return { incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordURL };
        } else {
            logger.debug(`Результат searchIncomingFollowMeInCdr ${util.inspect(resultSearcFolowMeCallInfo)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
            searchNotAnswerFollowMeInCdr(uniqueid, followMeNumber);
        }

    } catch (e) {
        return e;
    }
}


async function searchNotAnswerFollowMeInCdr(uniqueid, followMeNumber) {
    try {
        const resultSearcNotAnswerFolowMeCallInfo = await db.query('select calldate,src,dstchannel,did,disposition,billsec,recordingfile from cdr where uniqueid like  "' + uniqueid + '" ORDER BY billsec');
        if (resultSearcNotAnswerFolowMeCallInfo.length != 0) {
            const calldate = moment(result[0].calldate).format("YYYY/MM/DD HH:mm:ss");
            const incomingNumber = result[0].src;
            const recordPath = moment().format("YYYY/MM/DD/");
            const recordFile = result[0].recordingfile;
            const billsec = result[0].billsec;
            const dstchannel = followMeNumber;
            const did = appConfig.sipTrunkNumber[result[0].did];
            const direction = "Incoming";
            const callStatus = appConfig.crmIncomingStatus[result[0].disposition];
            const recordURL = "http://185.69.154.243:8888/rec/monitor/" + recordPath + recordFile;
            return { incomingNumber, did, dstchannel, direction, callStatus, calldate, billsec, recordURL };
        } else {
            logger.debug(`Результат searchNotAnswerFollowMeInCdr ${util.inspect(searchNotAnswerFollowMeInCdr)}`);
            logger.debug(`Не нашлась запись в базе по ID ${uniqueid}`);
        }
    } catch (e) {
        return e;
    }
}


module.exports = { searchVoicemail, searchIncomingCallInfoInCdr, searchOutgoingCallInfoInCdr, searchIncomingFollowMeInCdr, searchNotAnswerFollowMeInCdr };