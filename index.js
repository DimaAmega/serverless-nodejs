const fs = require('fs');

const axios = require("axios");
const formData = require("form-data");

const AUTH_URL =
  process.env.OS_AUTH_URL || "https://api.selvpc.ru/identity/v3/auth/tokens";
const API_URL =
  process.env.SELECTEL_API_S8S_URL ||
  "https://ru-1.api.serverless.selcloud.ru/v1";
const ENV_VARS = {
  OS_USERNAME: process.env.OS_USERNAME,
  OS_PASSWORD: process.env.OS_PASSWORD,
  OS_PROJECT_DOMAIN_NAME: process.env.OS_PROJECT_DOMAIN_NAME,
  OS_PROJECT_ID: process.env.OS_PROJECT_ID,
  OS_USER_DOMAIN_NAME: process.env.OS_USER_DOMAIN_NAME,
};

const client = {};
const api = axios.create({ baseURL: API_URL });
const authData = {
  auth: {
    identity: {
      methods: ["password"],
      password: {
        user: {
          name: ENV_VARS.OS_USERNAME,
          domain: {
            name: ENV_VARS.OS_USER_DOMAIN_NAME,
          },
          password: ENV_VARS.OS_PASSWORD,
        },
      },
    },
    scope: {
      project: {
        id: ENV_VARS.OS_PROJECT_ID,
        domain: { name: ENV_VARS.OS_PROJECT_DOMAIN_NAME },
      },
    },
  },
};

let xAuthToken;

api.interceptors.response.use((response) => response.data, (error) => {
  if (error && error.response && error.response.status === 401) {
    // delete, because header is not fresh anymore
    delete error.config.headers['X-Auth-Token'];
    return auth().then(() => api.request(error.config));
  }
  return Promise.reject(error);
});

api.interceptors.request.use((config) => {
  if (xAuthToken) {
    return Promise.resolve(config);
  }
  checkEnvVars();
  return auth().then(() => {
    // set headers for current request
    config.headers["X-Auth-Token"] = xAuthToken;
    config.headers["project-id"] = ENV_VARS.OS_PROJECT_ID;
    return config;
  });
});

const auth = () => {
  return axios.post(AUTH_URL, authData).then(({ headers }) => {
    xAuthToken = headers["x-subject-token"];
    // set headers for future requests
    api.defaults.headers["X-Auth-Token"] = xAuthToken;
    api.defaults.headers["project-id"] = ENV_VARS.OS_PROJECT_ID;
  });
};

const checkEnvVars = () => {
  let emptyEnvVars = [];
  for (let [key, value] of Object.entries(ENV_VARS)) {
    if (value == null) {
      emptyEnvVars.push(key);
    }
  }
  if (emptyEnvVars.length) {
    const errorMessage = `Provide environment variables ${emptyEnvVars.join(", ")}`;
    console.error(errorMessage)
    throw new Error(errorMessage);
  }
};

client.startCreateFunction = (functionConfig) => {
  return api.post(`${API_URL}/functions/create`, functionConfig);
};

client.startEditFunction = (name, functionConfig) => {
  return api.post(`${API_URL}/functions/${name}/edit`, functionConfig);
};

client.getFunction = (name) => {
  return api.get(`${API_URL}/functions/${name}`);
};

client.getFunctions = (skip, limit, name, sort_field, sort_type = "desc") => {
  const params = { skip, limit, name, sort_field, sort_type };
  return api.get(`${API_URL}/functions`, { params });
};

client.deleteFunction = (name) => {
  return api.delete(`${API_URL}/functions/${name}`);
};

client.startInvokeFunction = (name, payload) => {
  return api.post(`${API_URL}/functions/${name}/invoke`, payload);
};

client.publishFunction = (name, isPublish) => {
  return api.post(`${API_URL}/functions/${name}/publish`, {
    publish: !!isPublish,
  });
};

client.uploadModule = (pathToFile) => {
  const form = new formData();
  form.append("module", fs.createReadStream(pathToFile));
  return api.post(`${API_URL}/modules/upload`, form, {
    headers: form.getHeaders(),
  })
};

client.getModule = (id) => {
  return api.get(`${API_URL}/modules/${id}`);
};

client.getModules = () => {
  return api.get(`${API_URL}/modules`);
};

client.deleteModule = (id) => {
  return api.delete(`${API_URL}/modules/${id}`);
};

// since and upto - timestamp
client.getActivations = (action_name, limit, skip, since, upto) => {
  const params = {action_name, limit, since, skip, upto};
  return api.get(`${API_URL}/activations`, { params });
};

client.getActivationResult = (id) => {
  return api.get(`${API_URL}/activations/${id}/result`);
};

client.getActivationLogs = (id) => {
  return api.get(`${API_URL}/activations/${id}/logs`);
};

client.getFeedActions = () => {
  return api.get(`${API_URL}/feed_actions`);
};

client.getFeeds = () => {
  return api.get(`${API_URL}/feeds`);
};

client.getFeed = (name) => {
  return api.get(`${API_URL}/feeds/${name}`);
};

client.createFeed = (feed_name, feed_action, action_name, parameters) => {
  return api.put(`${API_URL}/feeds/create`, {
    feed_name,
    feed_action,
    action_name,
    parameters,
  });
};

client.deleteFeed = (name) => {
  return api.delete(`${API_URL}/feeds/${name}`);
};

client.getLimits = () => {
  return api.get(`${API_URL}/projects/limits`);
};

client.changeLimits = (payload) => {
  return api.put(`${API_URL}/projects/limits`, payload);
};

module.exports = client;
