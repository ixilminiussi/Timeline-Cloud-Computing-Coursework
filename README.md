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

To start development, run these two commands in separate shells.

```bash
npm run start
npx tailwindcss -o public/main.css --watch --jit --purge="./views/*.ejs"
```

