# Serverless cloud functions
## Contents

1. [Quick Start](#Quick-Start)
2. [Examples](#Examples)
3. [Useful](#Useful)
4. [Community](#Community)
5. [Licensing](#Licensing)

## Quick Start

1. Install:
    ```
    npm i @selectel/s8s
    ```
2. Go to [Cloud platform](https://my.selectel.ru/vpc) -> All users. Create new user (or use existing one) and add it to your project.
3. Go to Cloud platform -> Access. Select user and any region. Click on "Download" button. rc.sh file will be downloaded.
4. Set environment variables (you can get them from rc.sh file):
    - OS_USERNAME
    - OS_PASSWORD (this one isn't stored in rc.sh)
    - OS_PROJECT_ID
    - OS_PROJECT_DOMAIN_NAME
    - OS_USER_DOMAIN_NAME
5. Create your own cloud function:
    ```js
   const client = require("@selectel/s8s");
   
   const functionConfig = {
     action_name: "my_first_function",
     function_id: null, // will be added later
     function_name: "main",
     file_name: "hello.js",
     limits: { memory: 256 },
     module_name: "hello",
     runtime: "nodejs",
     version: "12",
     env_vars: {},
   };
   
   client
     .uploadModule("./hello.js")
     .then(({ function_id }) => {
       return client.startCreateFunction({ ...functionConfig, ...{ function_id } });
     })
     .then(() => {
       client.getFunction(functionConfig.action_name)
     })
     .then(({status}) => {
       if (status.status === "IN PROGRESS") {
         // retry get function, until you get status "COMPLETE". This means function is ready for invoke.
       }
     })
     .then(() => {
       return client.startInvokeFunction(functionConfig.action_name, {inParams: "test"})
     }).then(({activationId}) => {
     client.getActivationResult(activationId).catch((err) => {
       // retry getActivationResult if receive 404. It means that invoke hasn't finished yet.
     })
     client.getActivationLogs(activationId).catch((err) => {
       // retry getActivationResult if receive 404. It means that invoke hasn't finished yet.
     })
   })
    ```
## Examples

You can see examples of using cloud functions
[here](https://github.com/selectel/serverless_functions_examples_nodejs)

## Useful

[Description](https://selectel.ru/services/cloud/serverless/)

[Docs](https://kb.selectel.com/docs/selectel-cloud-platform/serverless/description/)

[Serverless API](https://developers.selectel.com/docs/selectel-cloud-platform/serverless_api/)

## Community

[Telegram](https://t.me/SelectelCommunity)


## Licensing

Serverless is licensed under the [APACHE License](https://github.com/selectel/serverless-nodejs/blob/main/LICENSE).
