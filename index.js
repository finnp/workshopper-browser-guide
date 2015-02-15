var fs = require('fs')
var path = require('path')
var marked = require('marked')
var readjson = require('read-json-file')
var hb = require('handlebars')

var exerciseDir = './learnyounode/exercises'
var outputDir = './html'

var layout = hb.compile(fs.readFileSync(__dirname + '/assets/templates/layout.hbs').toString())
var header = hb.compile(fs.readFileSync(__dirname + '/assets/templates/header.hbs').toString())
var footer = hb.compile(fs.readFileSync(__dirname + '/assets/templates/footer.hbs').toString())
var indexTemplate = hb.compile(fs.readFileSync(__dirname + '/assets/templates/index.hbs').toString())

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
            workshoppername: 'Learn You Node',
            header: header({
              challengetitle: exerciseName,
              challengetotal: exercises.length,
              challengenumber: index + 1,
              workshoppername: 'Learn You Node',
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
    workshoppername: 'Learn You Node'
  })
  
  fs.writeFile(path.join(outputDir,  'index.html'), content)
}

// from workshopper module
function idFromName (id) {
  return id.toLowerCase()
    .replace(/\s/g, '_')
    .replace(/[^\w]/gi, '')
}