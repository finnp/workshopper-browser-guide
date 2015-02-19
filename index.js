var fs = require('fs-extra')
var path = require('path')
var marked = require('marked')
var hb = require('handlebars')
var highlight = require('highlight.js')
var githuburlfromgit = require('github-url-from-git')
var localizeLang = require('local-lang-names')
var lightness = require('lightness')
var contrast = require('get-contrast')

marked.setOptions({
  highlight: function (code) {
    var hl = highlight.highlightAuto(code, ['javascript'])
    return hl.value
  }
});

var layout = createTemplate('layout')
var header = createTemplate('header')
var footer = createTemplate('footer')
var indexTemplate = createTemplate('index')

module.exports = function (opts) {
  opts = opts || {}
  var moduleDir = opts.dir || process.cwd()
  var outputDir = opts.output || path.join(moduleDir, 'guide')
  var exerciseDir = path.join(moduleDir, 'exercises')
  
  var packagejson = require(path.join(moduleDir, 'package.json'))
  var repo = githuburlfromgit(packagejson.repository.url)
  
  var appName = opts.name || packagejson.name
  var appTitle = opts.title || appName
  
  var langs = getLanguages()
  
  try {
    fs.mkdirSync(outputDir)  
  } catch(e) {}
  
  fs.copySync(path.join(__dirname, 'assets'), path.join(outputDir, 'assets'))
  
  // adjust colors
  
  var stylepath = path.join(outputDir, 'assets', 'css', 'style.css')
  var styleTemplate = hb.compile(fs.readFileSync(stylepath).toString())
  opts.color = opts.color || '#0067c1'
  if(!contrast.isAccessible(opts.color, '#ffffff')) {
    console.error('Warning:', opts.color, 'does not provide enough contrast to be accessible.')
  }
  fs.writeFileSync(stylepath, styleTemplate({
    'color': opts.color,
    'color-lighter': lightness(opts.color, 15) // '#4BABFF'
  })) 
  
  
  var exercises = JSON.parse(fs.readFileSync(path.join(exerciseDir, 'menu.json')))

  langs.forEach(function (lang) {
    createIndex(exercises, lang)
    exercises.forEach(function (exerciseName, index) {
      var exerciseId = idFromName(exerciseName)
      var filename = (lang.id === 'en' ? 'problem' : 'problem.' + lang.id) + '.md'
      var problem = fs.readFileSync(path.join(exerciseDir, exerciseId, filename)).toString()

      var preurl = getExerciseUrl(index - 1, lang.id)
      var nexturl = getExerciseUrl(index + 1, lang.id)
      
      var content = layout({
        lang: lang.id,
        body: marked(replacePlaceholders(problem)),
        footer: footer({
          preurl: preurl,
          nexturl: nexturl,
          prename: localizeExerciseName(exercises[index-1], lang),
          nextname: localizeExerciseName(exercises[index+1], lang),
          repo: repo
        }),
        workshoppername: appTitle,
        header: header({
          challengetitle: localizeExerciseName(exerciseName, lang),
          challengetotal: exercises.length,
          challengenumber: index + 1,
          workshoppername: appTitle,
          preurl: preurl,
          nexturl: nexturl,
          lang: lang.id,
          langs: templateLangs(exerciseId, langs),
          indexurl: getUrl('index', lang.id)
        })
      })
      
      fs.writeFile(path.join(outputDir, getUrl(idFromName(exerciseName), lang.id)), content)    
      
    })
  })

  function replacePlaceholders(contents) {
    var variables = {
      appname : appName, 
      rootdir : moduleDir
    }

    contents = contents.replace(/\{([^}]+)\}/gi, function (match, k) {
      return variables[k] || ('{' + k + '}')
    })

    // proper path resolution
    contents = contents.replace(/\{rootdir:([^}]+)\}/gi, function (match, subpath) {
      // how to link this in a sensible way, so that it will work online/offline?
      return '[' + subpath + '](' + '..' + subpath + ')'
    })
    
    return contents
  }

  function getExerciseUrl(index, lang) {
    var name = exercises[index]
    if(name) {
      return getUrl(idFromName(name), lang)
    } else {
      return getUrl('index', lang)
    }
  }

  function getUrl(id, lang) {
    var langsuffix = lang === 'en' ? '' : '.' + lang
    var file = id + langsuffix + '.html'
    return file
  }
  
  function localizeExerciseName(exercise, lang) {
    return lang.i18n.exercise ? lang.i18n.exercise[exercise] : exercise
  }

  function templateLangs(id, langs) {
    return langs.map(function (lang) {
      return {name: localizeLang(lang.id), url: getUrl(id, lang.id)}
    })
  }
  

  function createIndex(exercises, lang) {
    var challenges = exercises.map(function (exercise) {
      return {
        name: localizeExerciseName(exercise, lang),
        url: getUrl(idFromName(exercise), lang.id)
      }
    })
    
    var content = indexTemplate({
      challenges: challenges,
      workshoppername: appTitle,
      repo: repo,
      langs: templateLangs('index', langs)
    })
    
    fs.writeFile(path.join(outputDir,  getUrl('index', lang.id)), content)
  }
  
  function getLanguages() {
    var p = path.join(moduleDir, 'i18n')
    return fs.readdirSync(p)
      .filter(function (file) {
        return file.substr(-5) === '.json'
      })
      .map(function (file) {
        var i18n = JSON.parse(fs.readFileSync(path.join(p, file)))
        var langid = file.substr(0, file.length - 5)
        return {id: langid, i18n: i18n}
      })
  }
}


function createTemplate(tmpl) {
  var p = path.join(__dirname, 'templates', tmpl + '.hbs')
  return hb.compile(fs.readFileSync(p).toString())
}

function idFromName (id) {
  return id.toLowerCase()
    .replace(/\s/g, '_')
    .replace(/[^\w]/gi, '')
}