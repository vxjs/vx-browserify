var browserify = require('browserify');
var stream     = require('stream');
var through2   = require('through2');
var path       = require('path');

module.exports = VxBrowserify;

/**
 * @constructor
 */
function VxBrowserify(vx) {
  this.vx = vx;
  this.transform = this.transform.bind(this);
}

/**
 * @property name
 */
VxBrowserify.prototype.name = 'vx-browserify';

/**
 * Attach
 */
VxBrowserify.prototype.attach = function () {
  this.vx.plugins['vx-unit'].registerTransform('vx-browserify', this.transform);
};

/**
 * Transformation function
 */
VxBrowserify.prototype.transform = function (filepath) {
  var buffer = '';
  var vx  = this.vx;

  function transform(chunk, enc, cb) {
    buffer += chunk.toString();
    cb();
  }

  function flush() {
    var data = new stream.Readable();
    var standaloneName = path.basename(filepath).split('.')[0];
    data.push(buffer);
    data.push(null);

    browserify({
      entries: [data],
      debug: true,
      standalone: standaloneName
    }).bundle(function (err, result) {
      if (err) {
        vx.error('unable to bundle', filepath);
        vx.error(err);
      } else {
        this.push(result);
        vx.debug(filepath, 'is bundled as window.' + standaloneName);
      }

      this.push(null);
    }.bind(this));
  }

  return through2(transform, flush);
};
