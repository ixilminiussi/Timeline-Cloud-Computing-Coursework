# Timeline: COMP3207 Coursework 2

The source code for Group H's Timeline game. Created for COMP3207 Coursework 2.  

The commands below are in bash.

## API

Contains the Azure Functions project that provides an endpoint that the game can use to retrive persistent data (card decks and accounts).

### One-Time Setup

Create a virtual environment with Python 3.8.9 and download the azure packages into it. VS Code might offer to do some of this for you.

```bash
cd API
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Make sure you have the Azure Core Tools installed (the `func` command-line tool):

```bash
which func
# /opt/homebrew/bin/func
```

If the tool is not found, follow the [install instructions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash%2Ckeda).

### Every Time

Run this before starting a development session. VS Code might do this for you when you open a terminal window.

```bash
cd API
source .venv/bin/activate
func host start
```

### Helpful Tips

Some things you can do after following the steps above to verify your setup is correct:

```bash
which python
# /path/to/Timeline/API/.venv/bin/python
python --version
# Python 3.8.9
```

## Server

Contains the server-side game logic as well as the client-side HTML (written with EJS and powered by Vue 2). [TailwindCSS](https://tailwindcss.com/) is used in this project.

### One-Time Setup

Install the necessary modules

```bash
cd Server
npm install
```

### Every Time

To start development, run these two commands from the `Server` folder in separate shells.

```bash
npm run start
npx tailwindcss -o public/main.css --watch --jit --purge="./views/*.ejs"
```

