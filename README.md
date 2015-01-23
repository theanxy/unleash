# #Unleash your path

This is a work in progress. Things are subject to change.

[![Build Status](https://travis-ci.org/x-team/unleash.svg?branch=master)](https://travis-ci.org/x-team/unleash)

## TODO

1. Add more unit and e2e tests
2. Don’t show higher card levels if level 1 hasn’t been started yet
3. Add nice URLs for cards
4. Analyse all code against [Angular.js guidelines](#coding-standards) more closely

## Setup

Make sure that you have newest `Compass` in your system.

```
sudo gem update
```

Install required dependencies:

```
npm install && bower install
```

## Preview 

### Local environment

Run a local server:

```
grunt serve
```

Browse to the app at `http://localhost:9000`.

### Public version

The project is being deployed to https://unleash-app.firebaseapp.com.

## Running tests

You can run all tests concurrently via grunt: `runt test`.

### Unit

Unit tests use Karma, Mocha, Chai and Sinon.JS.

```
grunt test:unit
```

### End to end

E2E tests use Protractor, Mocha, Chai and Chai as Promised.

```
grunt test:e2e
```

## Coding Standards

* CSS: http://bem.info/method/
* Angular.js: https://github.com/johnpapa/angularjs-styleguide
