var gulp = require('gulp');
var winInstaller = require('electron-windows-installer');

gulp.task('create-windows-installer', function(done) {
  winInstaller({
    appDirectory: './sqload-win32-x64',
    outputDirectory: './installer',
    authors: 'Cecil Lew',
    iconUrl: 'http://icons.iconarchive.com/icons/carlosjj/google-jfk/48/android-icon.png',
    arch: 'ia32'
  }).then(done).catch(done);
});

gulp.task('default', [ 'create-windows-installer' ]);