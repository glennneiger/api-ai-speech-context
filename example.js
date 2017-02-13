const fs = require('fs');
const agentDownloader = require('api-ai-agent-downloader');

const { generateSpeechContext } = require('./index');


// Retrieves the agent's API.AI summary, using a saved local copy, if any.
const getAgentSummaryPromise = (agentName, developerToken) => {
  const path = agentName + '.json';
  if (fs.existsSync(path)) {
    const summary = JSON.parse(fs.readFileSync(path, 'utf8'));
    return Promise.resolve(summary);
  } else {
    return agentDownloader.getSummary(agentName, developerToken).then(summary => {
      fs.writeFileSync(path, JSON.stringify(summary));
      return summary;
    });
  }
};

const agentName = 'agent_foo';
const developerToken = 'abc123';
const blacklist = ['bad', 'words', 'and phrases'];

getAgentSummaryPromise(agentName, developerToken)
    .then(summary => {
      const context = generateSpeechContext(summary, blacklist);
      console.log(`=> Generated speech context for ${agentName}.`);
      fs.writeFileSync('./speechContext.json', JSON.stringify(context));
    })
    .catch(error => console.error(error));
