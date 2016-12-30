# Gendat - Test data generation tool for SQL Server

## Introduction

Gendat is written in Electron with Angular 2. The project is in perpetual beta stage. Currently, it provides the following list of features:

1. Connecting to a SQL Server data source

1. Select a number of tables to generate test data

1. (Future) Connecting to a web service to retrieve sample data, including people names and addresses

1. (Future) Shaping the generated data with statistical functions

## Dependencies

- npm

- Webpack module loader

- JQuery (currently using 1.12.4)

- Bootstrap (currently using 3.3.7)

- Fontawesome

- Angular 2

- Typescript

- Electron

## Quick start

```bash
# clone our repo
# --depth 1 removes all but one .git commit history
git clone https://github.com/five-star-potato/gendat.git

# change directory to our repo
cd gendat

# install the repo with npm
npm install

# compile and start the application
npm run build
npm run start

# package for x86 deployment
npm run package
```
## License

MIT



