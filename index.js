var fs = require('fs'),
	path = require('path'),
	url = require("url"),
	gd = require('node-gd'), 
	mime = require('mime');

/**
 * TODO: Verify this is a complete list
 */
var mimes_allowed = [
	"image/gif",
	"image/jpeg",
	"image/png"
];

/**
 * Create a new Picsee Object 
 */
function Picsee () {
	if (!(this instanceof Picsee)) {
		return new Picsee();
	}
}

/**
 * @param {Object} options Object containing application settungs
 * @property {String} _sandboxDir Safe location where file is validated
 * @property {String} _processDir Location of pre-processed file
 * @property {String} _uploadDir Final destination of uploaded file
 * @property {Array} _inputFields Named inputs that images will be uploaded from
 */
Picsee.prototype.initialize = function (options) {
	var self = this;
  options = options || {};
  self._docRoot = options._docRoot || false;
	self._sandboxDir = options.sandboxDir || false;
	self._processDir = options.processDir || false;
	self._uploadDir = options.uploadDir || false;
	self._namingConvention = options.namingConvention || [];
	self._inputFields = options.inputFields || [];
	return self;
}

/**
 * FYI:
 * 
 * imagecopyresized() copies a rectangular portion of one image to another image.
 * dst_image is the destination image, src_image is the source image identifier.
 * 
 * imagecopyresampled() copies a rectangular portion of one image to another image,
 * smoothly interpolating pixel values so that, in particular, reducing the size of 
 * an image still retains a great deal of clarity.
 */ 

/**
 * This example crops the image in half
 * See: https://github.com/taggon/node-gd/wiki/Usage
 */ 

Picsee.prototype.upload = function (req, res, next) {
	var self = this;
	console.log('self', self);

	// Check to see if file is an acceptable image
	var allowed = self._inputFields;

	for (var file in req.files) {
		if (allowed.indexOf(file) !== -1) {
			console.log(file, 'is allowed');
		}
	}

	next();

/*

	var name = renameImage(self._namingConvention, name);	
	
	// Change this to use the array of input fields
	var photo = req.files.profPhoto.path;

	// Update `Naming Conventions` here...
	var date = new Date().getTime();
	var ext = getFileExt(req.files.profPhoto.type);
	var filePath = self._sandboxDir +  uuid + '-' + date + '.' + ext;
	var destPath = self._docRoot + filePath;
	var urlPath = req.protocol + "://" + req.get('host') + "/" + filePath;
	
	fs.readFile(photo, function (err, data) {
		if (err) res.redirect('index');
		fs.writeFile(destPath, data, function (err) {
			if (err) res.render('form', { msg: 'There was an error uploading your file:' + err });
			var mime = getMime(destPath);
			if (mimes_allowed.indexOf(mime) !== -1) {
				var w = 400;
				resizeTo(destPath, ext, w);
				res.render('uploaded', { title: 'Express', sandbox: urlPath });
			} else {
				var msg = 'Are you crazy???? You can\'t upload that kind of file <em>("' + mime +'")</em> !!!!';
				res.render('form', { msg: msg });
			}
		});
	});

*/

}

Picsee.prototype.crop = function (req, res) {
	options = prepareOptions(req.body);
	console.log("post", req.body)
	console.log("options:", options);
	var path = path.dirname(url.parse(req.body.image).pathname);
	console.log(url.parse(req.body.image));
}

function getFileExt(type) {
	var parts = type.split("/");
	return parts[1];	
}

function getMime(img) {
	return mime.lookup(img);
}

function resizeTo(img, ext, w) {
	switch (ext) {
		case "jpeg":
			resizeJpeg(img, w);
			break;
		case "gif":
			resizeGif(img, w);
			break;
		case "png":
			resizePng(img, w);
			break;
	}
}

/**
 * Create an object containing the Coordinates of the cropped image
 */ 
function prepareOptions (post) {
	return {
		x1: post.coordx1,
		y1: post.coordy1,
		x2: post.coordx2,
		y2: post.coordy2,
		w: post.w,
		h: post.h
	}
}

/**
 * This method REPLACES the temp file with a resized one
 */ 
function resizeJpeg(img, w, h) {
	w = (w) ? w : false;
	h = (h) ? h : false;
	var src = gd.createFromJpeg(img);
	if (w) rescaleFromWidth(w, src.width ,src.height);
	if (h) rescaleFromHeight(h, src.width ,src.height);
	var target = gd.createTrueColor(w, h);
	src.copyResampled(target, 0, 0, 0, 0, w, h, src.width,src.height);
	target.saveJpeg(img, 80);
}

function resizeGif(img, w, h) {
	w = (w) ? w : false;
	h = (h) ? h : false;
	var src = gd.createFromGif(img);
	if (w) rescaleFromWidth(w, src.width ,src.height);
	if (h) rescaleFromHeight(h, src.width ,src.height);
	var target = gd.createTrueColor(w, h);
	src.copyResampled(target, 0, 0, 0, 0, w, h, src.width,src.height);
	target.saveGif(img, 80);
}

function resizePng(img, w, h) {
	w = (w) ? w : false;
	h = (h) ? h : false;
	var src = gd.createFromPng(img);
	if (w) h = rescaleFromWidth(w, src.width ,src.height);
	if (h) w = rescaleFromHeight(h, src.width ,src.height);
	var target = gd.createTrueColor(w, h);
	src.copyResampled(target, 0, 0, 0, 0, w, h, src.width,src.height);
	target.savePng(img, 9);
}

/**
 * @description Calculates new Dimensions based on Desired Width
 * @param w Desired Width
 * @param sw Source Width
 * @param sh Source Height
 */
function rescaleFromWidth(w, sw, sh) {
	w = parseInt(w);
	sw = parseInt(sw);
	sh = parseInt(sh);
	if (w && sw && sh) return Math.round((sh * w) / sw);
	return false;
}

/**
 * @description Calculates new Dimensions based on Desired Width
 * @param h Desired Height
 * @param sw Source Width
 * @param sh Source Height
 */
function rescaleFromHeight(h, sw, sh) {
	h = parseInt(h);
	sw = parseInt(sw);
	sh = parseInt(sh);
	if (h && sw && sh) return Math.round((sh * h) / sw);
	return false;
}

/** 
 * @description  Generates a name based on naming options 
 * @param {String} convention Option describing how to rename this image.
 * @param {String} name Optional Name (if passed).
 */
function renameImage(convention, name) {
	switch (convention) {
		case 'application':
			return name || {};
			break;
		case 'date':
			return new Date().getTime();
			break;
		default:
			return 
	}	
}

exports = module.exports = new Picsee();
exports.Picsee = Picsee;