#!/usr/bin/env node

var createGuide = require('./')
var minimist = require('minimist')

createGuide(process.cwd(), minimist(process.argv.splice(2)))
