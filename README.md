# API.AI Speech Context

Generates a Google Cloud Speech API
[`SpeechContext`](https://cloud.google.com/speech/reference/rpc/google.cloud.speech.v1beta1#speechcontext)
for your
[API.AI agent](https://docs.api.ai/docs/concept-agents).

## Usage

`generateSpeechContext` takes two parameters:

  - `summary`: An API.AI agent summary object with the keys `name`, `entities`, and `intents`.*
  - `blacklist`: An array of words to blacklist from the context.

* as produced by [`api-ai-agent-downloader`](https://www.npmjs.com/package/api-ai-agent-downloader).

It returns an array containing words and phrases based on your agent's entities and intents.
Non-blacklisted single words are given highest priority, then phrases that contain at least one
non-blacklisted word. Entities within intent templates (e.g. '@sys.any') are removed.

The array comports with the Google Cloud Speech API's SpeechContext
[usage limits](https://cloud.google.com/speech/limits#content).

## Example

```js
const agentDownloader = require('api-ai-agent-downloader');
const { generateSpeechContext } = require('api-ai-speech-context');
const fs = require('fs');

const agentName = 'agent_foo';
const developerToken = 'abc123';

const blacklist = ['bad', 'words', 'and phrases'];
const removeCommonWords = true;  // true by default

agentDownloader.getSummary(agentName, developerToken)
    .then(summary => {
      const context = generateSpeechContext(summary, blacklist, removeCommonWords);
      fs.writeFileSync('./speechContext.json', JSON.stringify(context));
    })
    .catch(error => console.error(error));
```
