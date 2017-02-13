# API.AI Speech Context

Generate a Google Cloud Speech API `SpeechContext` for your API.AI agent.

## Usage

```js
const { downloadAgentSummary, generateSpeechContext } = require('api-ai-speech-context');
const fs = require('fs');

const summary = downloadAgentSummary(developerToken);
const context = generateSpeechContext(summary);
fs.writeFileSync('./speechContext.json', JSON.stringify(context));
```

## Multiple agents
