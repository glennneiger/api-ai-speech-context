var fs = require('fs');
var Promise = require('promise');

const API_AI_URL_BASE = 'https://api.api.ai/v1/';
const API_AI_VERSION = '2015091';

module.exports = downloadAgentSummary = (developerToken, fetcher = new ThrottledFetcher()) => {

  const fetchResource = (resource) => {
    const url = API_AI_URL_BASE + resource + '?v=' + API_AI_VERSION;
    const options = { headers: { authorization: 'Bearer ' + developerToken } };
    return fetcher.fetch(url, options);
  };

  const entityIndexPromise = fetchResource('entities');
  const intentIndexPromise = fetchResource('intents');

  return Promise.all([ entityIndexPromise, intentIndexPromise ]).then((values) => {

    const entityIndex = values[0];
    const intentIndex = values[1];

    const entityIds = entityIndex.map(item => item.id);
    const intentIds = intentIndex.map(item => item.id);

    const entityPromises = entityIds.map((id, i) => {
      if (isTest && i !== 0) return Promise.resolve(null);
      return fetchResource('entities/' + id);
    });

    const intentPromises = intentIds.map((id, i) => {
      if (isTest && i !== 0) return Promise.resolve(null);
      return fetchResource('intents/' + id);
    });

    const entitiesPromise = Promise.all(entityPromises);
    const intentsPromise = Promise.all(intentPromises);

    return Promise.all([ entitiesPromise, intentsPromise ]);
  }).then((values) => {
    let [ entities, intents ] = values;
    entities = entities.filter(entity => Boolean(entity));
    intents = intents.filter(intent => Boolean(intent));
    return { entities, intents };
  });
};
