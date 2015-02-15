var fs = require('fs-extra')
var path = require('path')
var marked = require('marked')
var readjson = require('read-json-file')
var hb = require('handlebars')
var highlight = require('highlight.js')

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

module.exports = function (moduleDir, opts) {
  opts = opts || {}
  var outputDir = opts.outputDir || path.join(moduleDir, 'guide')
  var exerciseDir = path.join(moduleDir, 'exercises')
  
  try {
    fs.mkdirSync(outputDir)  
  } catch(e) {}
  
  fs.copySync(path.join(__dirname, 'assets'), path.join(outputDir, 'assets'))

  readjson(path.join(exerciseDir, 'menu.json'), function (err, exercises) {
    if(err) throw err
    
    createIndex(exercises)

    exercises
      .forEach(function (exerciseName, index) {
        var exerciseId = idFromName(exerciseName)
          fs.readFile(path.join(exerciseDir, exerciseId, 'problem.md'), function (err, data) {
            if(err) throw err
            
            var content = layout({
              body: marked(data.toString()),
              footer: footer({
                preurl: idFromName(exercises[index - 1] || 'index') + '.html',
                nexturl: idFromName(exercises[index + 1] || 'index') + '.html',
                prename: exercises[index-1],
                nextname: exercises[index-1]
              }),
              workshoppername: opts.name,
              header: header({
                challengetitle: exerciseName,
                challengetotal: exercises.length,
                challengenumber: index + 1,
                workshoppername: opts.name,
                preurl: idFromName(exercises[index - 1] || 'index') + '.html',
                nexturl: idFromName(exercises[index + 1] || 'index') + '.html'
              })
            })
            
            fs.writeFile(path.join(outputDir, exerciseId + '.html'), content)
          })
      })  
  })


  function createIndex(exercises) {
    var challenges = exercises.map(function (exercise) {
      return {name: exercise, url: idFromName(exercise) + '.html'}
    })
    
    var content = indexTemplate({
      challenges: challenges,
      workshoppername: opts.name
    })
    
    fs.writeFile(path.join(outputDir,  'index.html'), content)
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