(function() {
    'use strict';
    var $ = require('gulp-load-plugins')();
    var argv = require('yargs')
        .argv;
    var gulp = require('gulp');
    var rimraf = require('rimraf');
    var sequence = require('run-sequence');
    var concatCss = require('gulp-concat');
    var less = require('gulp-less');
    var LessPluginAutoPrefix = require('less-plugin-autoprefix');
    var autoprefix = new LessPluginAutoPrefix({
        browsers: ['last 2 versions']
    });
    var sourcemaps = require('gulp-sourcemaps');
    var gzip = require('gulp-gzip');
    var inject = require('gulp-inject');
    var buildTarget = 'build';
    var clone = require('gulp-clone');
    var rename = require('gulp-rename');
    var templateCache = require('gulp-angular-templatecache');
    var watch = require('gulp-watch');
    var addsrc = require('gulp-add-src');
    // setup babel
    var babel = require('gulp-babel');
    // Check for --production flag
    // The environment to run the node test webserver on. Defaults to localhost.
    var testServerHost = argv.testServerHost || 'localhost';
    // Potentially override api url
    var isProduction = argv.minify === 'true' ? true : false;
    // 2. FILE PATHS
    // - - - - - - - - - - - - - - -
    var paths = {
        assets: ['./client/**/*.*', '!./client/modules/**/*.*', '!./client/**/*.js'],
        // All 3rd Party JS Libraries (not related to angular)
        thirdpartyjs: {
            noBabel: ['client/bower_components/lodash/lodash.js'],
            babel: []
        },
        thirdpartycss: [],
        thirdpartyassets: [],
        less: ['client/assets/less'],
        // angular and modules
        frameworksJS: ['client/bower_components/angular/angular.js', 'client/bower_components/angular-ui-router/release/angular-ui-router.js'],
        // These files are for your app's JavaScript
        appJS: ['client/*.js', 'client/modules/**/index.module.js', 'client/components/**/*.js', 'client/components/*.js', 'client/controllers/**/*.js', 'client/directives/**/*.js', 'client/modules/**/*.js', 'client/services/**/*.js', 'client/filters.js', 'client/playground/*.js'],
        fonts: []
    };
    // 3. TASKS
    // - - - - - - - - - - - - - - -
    // Cleans the build directory
    gulp.task('clean', function(cb) {
        rimraf('./build', {
            force: true
        }, cb);
    });
    // Copies everything in the client folder except templates, Less, and JS
    gulp.task('copy', function() {
        var temp = paths.assets.concat('./client/assets/static/*.js');
        return gulp.src(temp, {
                base: './client/'
            })
            .pipe(gulp.dest(buildTarget));
    });
    gulp.task('copy:modules', function() {
        return gulp.src('./client/modules/**/*.html', {
                base: './client/modules'
            })
            .pipe(gulp.dest(buildTarget + '/assets/js'));
    });
    gulp.task('copy:workers', function() {
        return gulp.src('./client/assets/static/*.*')
            .pipe(gulp.dest('./build/assets/static'));
    });
    gulp.task('templates', function() {
        return gulp.src(['./client/templates/**/*.html', './client/modules/**/*.html', './client/directives/*.html', './client/templates/*.html', './client/components/templates/*.html'])
            .pipe(templateCache({
                standalone: true
            }))
            .pipe(gulp.dest('./client'));
    });
    gulp.task('copy:thirdpartycss', function() {
        return gulp.src(paths.thirdpartycss)
            .pipe(concatCss('thirdparty.css'))
            .pipe(gulp.dest(buildTarget + '/assets/css/thirdparty'));
    });
    gulp.task('copy:thirdpartyassets', function() {
        return gulp.src(paths.thirdpartyassets)
            .pipe(gulp.dest(buildTarget + '/assets/css/thirdparty'));
    });
    gulp.task('less', function() {
        return gulp.src('client/assets/less/app.less')
            .pipe(less({
                paths: ['client/bower_components/bootstrap/less', 'client/assets/less', 'client/assets/less/directives', 'client/assets/less/components'],
                plugins: [autoprefix]
            }))
            .pipe(gulp.dest(buildTarget + '/assets/css/'));
    });
    // Compiles and copies the Foundation for Apps JavaScript, as well as your app's custom JS
    gulp.task('uglify', ['uglify:thirdpartyjs', 'uglify:frameworks']);
    gulp.task('uglify:production', function() {
        var thirdPartyBlob = [].concat.call(paths.thirdpartyjs.noBabel, paths.frameworksJS);
        return gulp.src(paths.appJS.concat(paths.thirdpartyjs.babel))
            .pipe(babel())
            .pipe(addsrc.prepend(thirdPartyBlob))
            .pipe(addsrc.append('client/templates.js'))
            .pipe($.concat('app.js'))
            // .pipe($.uglify({
            //     mangle: false
            // }))
            .pipe(gulp.dest(buildTarget + '/assets/js/'));
    });
    gulp.task('uglify:thirdpartyjs', function() {
        return gulp.src(paths.thirdpartyjs.babel)
            .pipe(babel())
            .pipe(addsrc.append(paths.thirdpartyjs.noBabel))
            .pipe($.concat('thirdparty.js'))
            .pipe(gulp.dest(buildTarget + '/assets/js/'));
    });
    gulp.task('uglify:babel', function() {
        return gulp.src(paths.appJS)
            .pipe(sourcemaps.init({
                identityMap: true
            }))
            .pipe(addsrc.append('client/templates.js'))
            .pipe(babel({
                presets: ['es2015'],
                compact: false
            }))
            .pipe($.concat('app.js'))
            .pipe(sourcemaps.write('../maps'))
            .pipe(gulp.dest(buildTarget + '/assets/js/'));
    });
    gulp.task('uglify:frameworks', function() {
        var uglify = $.if(isProduction, $.uglify()
            .on('error', function(e) {
                console.log(e);
            }));
        return gulp.src(paths.frameworksJS)
            .pipe(uglify)
            .pipe($.concat('frameworks.js'))
            .pipe(gulp.dest(buildTarget + '/assets/js/'));
    });
    gulp.task('uglify:app', function() {
        var uglify = $.if(isProduction, $.uglify()
            .on('error', function(e) {
                console.log(e);
            }));
        return gulp.src(paths.appJS)
            .pipe(addsrc.append('client/templates.js'))
            .pipe(gulp.dest(buildTarget + '/assets/js/'));
    });
    gulp.task('uglify:css', function() {
        return gulp.src(paths.thirdpartycss.concat(['build/assets/css/app.css']))
            .pipe($.concat('app.css'))
            .pipe(gulp.dest(buildTarget + '/assets/css/'));
    });
    gulp.task('gzip:js', function() {
        gulp.src('build/assets/js/app.js')
            .pipe(gzip({
                append: true
            }))
            .pipe(gulp.dest('build/assets/js'));
        var gz = gulp.src('build/assets/js/app.js.gz')
            .pipe(clone());
        gulp.src('build/assets/js/app.js.gz')
            .pipe(rename('app.js'))
            .pipe(gulp.dest('build/assets/js'));
        gz.pipe(gulp.dest('build/assets/js'));
    });
    gulp.task('gzip:css', function() {
        gulp.src('build/assets/css/app.css')
            .pipe(gzip({
                append: true
            }))
            .pipe(gulp.dest('build/assets/css'));
        var gz = gulp.src('build/assets/css/app.css.gz')
            .pipe(clone());
        gulp.src('build/assets/css/app.css.gz')
            .pipe(rename('app.css'))
            .pipe(gulp.dest('build/assets/css'));
        gz.pipe(gulp.dest('build/assets/css'));
    });
    // Starts a test server, which you can view at http://localhost:8080
    gulp.task('server', ['build'], function() {
        gulp.src(buildTarget)
            .pipe($.webserver({
                port: 8080,
                host: testServerHost,
                fallback: 'index.html',
                livereload: false,
                //open: 'http://localhost:8080/#/',
                path: '/'
            }));
    });
    // inject proper js bundles based on environment
    gulp.task('inject', function() {
        var target = gulp.src('build/index.html'),
            sources;
        if (isProduction) {
            sources = gulp.src(['./build/assets/js/app.js', './build/assets/css/app.css']);
        } else {
            sources = gulp.src(['build/assets/js/thirdparty.js', 'build/assets/js/frameworks.js', 'build/assets/js/app.js', './build/assets/css/app.css']);
        }
        return target.pipe(inject(sources, {
                relative: true
            }, {
                read: false
            }))
            .pipe(gulp.dest('build'));
    });
    // strips .gz to play nice with nginx static gzip stuff
    // Builds your entire app once, without starting a server
    // gulp build
    gulp.task('build', function(cb) {
        if (!isProduction) {
            console.warn('THIS IS NOT PRODUCTION');
            sequence('clean', 'templates', ['copy', 'copy:workers', 'copy:thirdpartyassets'], 'uglify', 'uglify:babel', 'less', 'uglify:css', 'inject', cb);
        } else {
            console.warn('THIS IS PRODUCTION!');
            sequence('clean', 'templates', ['copy', 'copy:workers', 'copy:thirdpartyassets'], 'uglify:production', 'less', 'uglify:css', 'inject', 'gzip:js', 'gzip:css', cb);
        }
    });
    gulp.task('watch:less', function() {
        return sequence('clean', 'copy', 'less', 'uglify:css', 'inject');
    });
    // Default task: builds your app, starts a server, and recompiles assets when they change
    gulp.task('default', ['build', 'server'], function(cb) {
        // Watch less
        gulp.watch(['./client/assets/less/**', './less/**/*'], ['watch:less']);
        // Watch JavaScript
        watch(paths.appJS, function() {
            sequence('uglify', 'uglify:babel');
        });
        // gulp.watch(['./client/bower_components/**/*.js'], [
        //     'uglify:thirdpartyjs', 'inject', 'uglify:css'
        // ]);
        gulp.watch(paths.assets.concat('./client/modules/**/*.html'), ['build']);
    });
})();
