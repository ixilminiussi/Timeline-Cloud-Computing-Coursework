# Timeline: COMP3207 Coursework 2

The source code for Group H's Timeline game, created for COMP3207 Coursework 2. Project management is done over in the Issues.

Contains the server-side game logic as well as the client-side HTML (written with EJS and powered by Vue 2). [TailwindCSS](https://tailwindcss.com/) is used in this project.

### One-Time Setup

Install the packages into `node_modules/`

```bash
npm install
```

Set up access to CosmosDb ([full instructions](https://www.npmjs.com/package/@azure/cosmos)). Create a `.env` file in the project root and copy in the following. Replace the values of the variables with the values from your Azure portal:

```
COSMOS_ENDPOINT = "https://your-account.documents.azure.com"
COSMOS_KEY = "<database account masterkey>"
```

### Every Time

To start development, first start TailwindCSS by running:

```bash
npx tailwindcss -o public/main.css --watch --jit --purge="./views/*.ejs"
```

This is what the output should look like:

```
aglen@Andrews-MBP Timeline % npx tailwindcss -o public/main.css --watch --jit --purge="./views/*.ejs"

warn - You have enabled the JIT engine which is currently in preview.
warn - Preview features are not covered by semver, may introduce breaking changes, and can change at any time.

Rebuilding...
Done in 69ms.
```

Then, *in another shell*, start the server with:

```bash
npm run start
```

This is what the output should look like:

```
aglen@Andrews-MBP Timeline % npm run start

> timeline@0.1.0 start
> node main.js

Server listening on port 8080
```

Open http://localhost:8080.

