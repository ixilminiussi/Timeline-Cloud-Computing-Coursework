# Timeline: COMP3207 Coursework 2

The source code for Group H's Timeline game. Created for COMP3207 Coursework 2.

## API

Contains the Azure Functions project that provides an endpoint that the game can use to retrive persistent data (card decks and accounts).

### One-Time Setup

Create a virtual environment with Python 3.8.9. VS Code might offer to do this for you.

```bash
# macOS/Linux
cd API
python3 -m venv .venv
```

Make sure you have the Azure Core Tools installed (the `func` command-line tool):

```bash
# macOS/Linux
which func
# /opt/homebrew/bin/func
```

If the tool is not found, follow the [install instructions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cmacos%2Ccsharp%2Cportal%2Cbash%2Ckeda).

### Every Time

Run this before starting a development session. VS Code might do this for you when you open a terminal window.

```bash
# macOS/Linux
cd API
source .venv/bin/activate
func host start
```

### Helpful Tips

Some things you can do after following the steps above to verify your setup is correct:

```bash
# macOS/Linux
which python
# /path/to/Timeline/API/.venv/bin/python
python --version
# Python 3.8.9
```

## Server

Contains the server-side game logic as well as the client-side HTML (written with EJS and powered by Vue 2). [TailwindCSS](https://tailwindcss.com/) is used in this project.
