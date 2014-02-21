module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-mocha-test'

  grunt.initConfig {
    coffee:
      compile:
        options:
          bare: true
          sourceMap: true
        files: [
          expand: true
          cwd: 'src/'
          src: ['*.coffee']
          dest: 'lib/'
          ext: '.js'
        ]
    coffeelint:
      grunt:
        files: src: ['Gruntfile.coffee']
      app:
        files: src: ['src/*.coffee']
      tests:
        files: src: ['test/*.coffee']
      options:
        max_line_length: level: 'ignore'
    mochaTest:
      test:
        src: ['test/*.coffee']
        options:
          require: 'coffee-script'
          clearRequireCache: true
    watch:
      options:
        interrupt: true
      grunt:
        files: ['<%= coffeelint.grunt.files.src %>']
        tasks: ['coffeelint:grunt']
      app:
        files: ['<%= coffeelint.app.files.src %>']
        tasks: ['coffeelint:app', 'mochaTest', 'coffee']
      tests:
        files: ['<%= mochaTest.test.src %>']
        tasks: ['coffeelint:tests', 'mochaTest']
  }

  grunt.registerTask 'check', ['coffeelint', 'mochaTest']
  grunt.registerTask 'default', ['check', 'coffee', 'watch']

