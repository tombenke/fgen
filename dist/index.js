#!/usr/bin/env node

/*jshint node: true */
'use strict';

/**
 * Universal generator module to create directories files and template based contents
 *
 * @module fgen
 */

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _wrench = require('wrench');

var _wrench2 = _interopRequireDefault(_wrench);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

var _datafile = require('datafile');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Create a directory tree based on the given configuration
 *
 * @arg {String} rootDirName - Path to the root directory of the tree to be created
 * @arg {Array} projectTree - The list of paths of the directories to be created
 * @arg {Boolean} removeIfExist - If the directores exist yet, then remove them if `true`
 *
 * @return {Boolean} - `true` if succeeded, `false` in case of error
 *
 * @function
 */
exports.createDirectoryTree = function (rootDirName, projectTree, removeIfExist) {
    var rootDirPath = _path2.default.resolve(rootDirName);

    if (_fs2.default.existsSync(rootDirPath)) {
        console.log("ERROR: Directory exists yet! " + rootDirPath);
        if (!removeIfExist) {
            return false;
        }
        console.log('Remove existing directory...');
        _wrench2.default.rmdirSyncRecursive(rootDirPath);
    }

    _wrench2.default.mkdirSyncRecursive(rootDirPath);
    projectTree.forEach(function (dir) {
        var dirToCreate = _path2.default.resolve(_path2.default.join(rootDirName, dir));
        console.log('Create "' + dirToCreate + '"');
        _fs2.default.mkdirSync(dirToCreate);
    });
    return true;
};

/**
 * Copy directories
 *
 * @arg {Object} opts - The options of the copy operation.
 * An object which has the following properties:
 *      {
 *          sourceBaseDir: {String},        // The path to the base directory to copy from
 *          targetBaseDir: {String},        // The path to the base directory to copy into
 *          dirName: {String},              // The directory to copy
 *          forceDelete: {Boolean},         // Whether to overwrite existing directory or not
 *          excludeHiddenUnix: {Boolean},   // Whether to copy hidden Unix files or not (preceding .)
 *          preserveFiles: {Boolean},       // If we're overwriting something and the file already exists, keep the existing
 *          inflateSymlinks: {Boolean}      // Whether to follow symlinks or not when copying files
 *          filter: {RegExp},               // A filter to match files against; if matches, do nothing (exclude).
 *          whitelist: {Boolean},           // if true every file or directory which doesn't match filter will be ignored
 *      }
 *
 * @function
 */
exports.copyDir = function (opts) {
    var sourceDirName = _path2.default.resolve(opts.sourceBaseDir, opts.dirName);
    var destDirName = _path2.default.resolve(opts.targetBaseDir, opts.dirName);

    console.log('Copy dir from: ' + sourceDirName + ' to: ' + destDirName);
    _wrench2.default.copyDirSyncRecursive(sourceDirName, destDirName, opts);
};

/**
 * Copy one file
 *
 * @arg {String} fileName - The name of the file to copy
 * @arg {String} sourceBaseDir - The source directory
 * @arg {String} targetBaseDir - The target directory
 *
 * @function
 */
exports.copyFile = function (fileName, sourceBaseDir, targetBaseDir) {
    console.log('copyFile...' + fileName);

    var sourceFileName = _path2.default.resolve(sourceBaseDir, fileName);
    var destFileName = _path2.default.resolve(targetBaseDir, fileName);

    console.log('Copy file from: ' + sourceFileName + ' to: ' + destFileName);
    _fs2.default.writeFileSync(destFileName, _fs2.default.readFileSync(sourceFileName));
};

/**
 * Load template partial files
 *
 * The function loads every file in the given folder, as a text file, then
 * then hangs them to an object, as properties.
 * The property names will be the filenames, of the original partial files, without the full path.
 *
 * @arg {String} basePath - The path to the directory which contains the partials
 *
 * @return {Object} - An object, which contains the partials.
 *
 * @function
 */
var loadPartials = function loadPartials(basePath) {
    return _.reduce((0, _datafile.mergeTextFilesByFileNameSync)((0, _datafile.findFilesSync)(basePath, /.*/)), function (acc, value, key) {
        acc[_.last(key.split('/'))] = value;
        return acc;
    }, {});
};

/**
 * Process a Handlebars template and extrapolates with the given context data, and write into a file.
 *
 * @arg {Object} context - The context data to fill into the template
 * @arg {Object} opts    - The template options:
 *      {
 *          sourceBaseDir: {String}     // The path to the directory of the templates and partials
 *          template: {String}          // The name of the main template file
 *          targetBaseDir: {String}     // The path to the directory of the target file
 *          target: {String}            // The name of the target file
 *      }
 *
 * @function
 */
exports.processTemplate = function (context, opts) {
    var templateFileName = _path2.default.resolve(opts.sourceBaseDir, opts.template);
    var resultFileName = _path2.default.resolve(opts.targetBaseDir, opts.target ? opts.target : opts.template);
    var rawTemplate = (0, _datafile.loadTextFileSync)(templateFileName);

    _handlebars2.default.registerPartial(loadPartials(opts.sourceBaseDir));
    (0, _datafile.saveTextFileSync)(resultFileName, _handlebars2.default.compile(rawTemplate)(context));
};

/**
 * Convert each markdown-format fields of the object to HTML
 *
 * @arg  {Object} doc - The document
 *
 * @return {Object} - A copy of the original document with processed markdown field values
 *
 * @function
 */
exports.convertMarkdown = function (doc, mdProps) {

    var getPropsDeep = function getPropsDeep(obj) {
        var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

        return _.flatMap(obj, function (value, key) {
            return _.isObject(value) ? getPropsDeep(value, path + key + '.') : path + key;
        });
    };
    var propsToConvert = _.filter(getPropsDeep(doc), function (prop) {
        return _.includes(mdProps, _.last(prop.split('.')));
    });

    var convertedProps = _.reduce(propsToConvert, function (acc, prop) {
        if (_.hasIn(doc, prop)) {
            _.set(acc, prop, (0, _marked2.default)(_.get(doc, prop)));
        }
        return acc;
    }, {});

    var result = _.merge({}, doc, convertedProps);
    //console.log('results: ', propsToConvert, JSON.stringify(convertedProps, null, '  '), JSON.stringify(result, null, '  '))
    return result;
};