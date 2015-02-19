#!/usr/bin/env node

var createGuide = require('./')
var minimist = require('minimist')

var opts = minimist(process.argv.splice(2))

if(opts.h || opts.help) {
  console.log('usage: workshopper-browser-guide')
  console.log('options:')
  console.log('\t--output\n\t\toutput dir (defaults to ./guide)')
  console.log('\t--name\n\t\tapp name (defaults to package.json name)')
  console.log('\t--title\n\t\tapp title (defaults to app name)')
  console.log('\t--color\n\t\tcolor style (defaults to blue)')
  process.exit()
}

createGuide(process.cwd(), opts)
