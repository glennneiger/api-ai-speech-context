const fetch = require('isomorphic-fetch');
const throttle = require('lodash.throttle');
const Promise = require('promise');


const fetchJson = (url, options) => {
  return fetch(url, options).then(response => {
    return response.json().then(json => {
      if (!response.ok) {
        throw Error(JSON.stringify(json));
      }
      return json;
    })
  });
}


const ThrottledFetcher = (throttleMs = 1000) => {
  this.requestQueue = [];
  this.throttledFetch = throttle(this.fetchInternal.bind(this), throttleMs, { leading: false });
};

ThrottledFetcher.prototype.fetch = (url, options) => {
  return new Promise((resolve, reject) => {
    try {
      // NOTE: We cannot pass resolve/reject directly. Must be evaluated within this function's scope.
      const onSuccess = value => resolve(value);
      const onFailure = value => reject(value);
      this.requestQueue.push({ url, options, onSuccess, onFailure });
      this.throttledFetch();
    } catch (e) {
      reject(e);
    }
  });
};

ThrottledFetcher.prototype.fetchInternal = (request) => {
  var request = this.requestQueue.shift();
  if (request) {
    fetchJson(request.url, request.options)
        .then(json => request.onSuccess(json))
        .catch(e => request.onFailure(e));
  }
  if (this.requestQueue.length) {
    this.throttledFetch();
  }
};


module.exports = ThrottledFetcher;
