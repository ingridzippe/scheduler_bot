"use strict";

var axios = require('axios')

module.exports = {
    interpretUserMessage(message, sessionId){
        return axios.get( 'https://api.dialogflow.com/v1/query', {
            params: {
                v: '20170712',
                query: message,
                sessionId,
                timezone: 'America/LosAngeles',
                lang: 'en'
            },
            headers: {
                Authorization: `Bearer ${process.env.SLACK_API_TOKEN}`
            }
        });
    }
};
