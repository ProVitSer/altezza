"use strict";
const log4js = require(`log4js`);

log4js.configure({
    appenders: {
        voip: {
            type: `file`,
            filename: `logs/debug.log`
        }
    },
    categories: {
        default: {
            appenders: [`voip`],
            level: `debug`
        }
    }
});
const logger = log4js.getLogger(`voip`);
module.exports = logger;
