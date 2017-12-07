#!/usr/bin/env node
/*jshint node: true */
'use strict';

/**
 * Universal generator module to create directories files and template based contents
 *
 * @module dgen
 */

import * as _ from 'lodash'
import handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import wrench from 'wrench'
import marked from 'marked'

import { loadTextFileSync, saveTextFileSync, findFilesSync, mergeTextFilesByFileNameSync } from 'datafile'

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
exports.createDirectoryTree = (rootDirName, projectTree, removeIfExist) => {
    const rootDirPath = path.resolve(rootDirName)

    if (fs.existsSync(rootDirPath)) {
        console.log( "ERROR: Directory exists yet! " + rootDirPath)
        if( ! removeIfExist ) {
            return false
        }
        console.log('Remove existing directory...')
        wrench.rmdirSyncRecursive(rootDirPath)
    }

    wrench.mkdirSyncRecursive(rootDirPath)
    projectTree.forEach( function(dir) {
        let dirToCreate = path.resolve( path.join( rootDirName, dir))
        console.log('Create "' + dirToCreate + '"')
        fs.mkdirSync(dirToCreate)
    })
    return true
}

/**
 * Copy directories
 *
 * @param {Object} opts - The options of the copy operation. An object which has the following properties:
 *
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
exports.copyDir = (opts) => {
    const sourceDirName = path.resolve(opts.sourceBaseDir, opts.dirName)
    const destDirName = path.resolve(opts.targetBaseDir, opts.dirName)

    console.log('Copy dir from: ' + sourceDirName + ' to: ' + destDirName)
    wrench.copyDirSyncRecursive(sourceDirName, destDirName, opts)
}

/**
 * Copy one file
 *
 * @arg {String} fileName - The name of the file to copy
 * @arg {String} sourceBaseDir - The source directory
 * @arg {String} targetBaseDir - The target directory
 *
 * @function
 */
exports.copyFile = (fileName, sourceBaseDir, targetBaseDir) => {
    console.log('copyFile...' + fileName)

    const sourceFileName = path.resolve(sourceBaseDir, fileName)
    const destFileName = path.resolve(targetBaseDir, fileName)

    console.log('Copy file from: ' + sourceFileName + ' to: ' + destFileName)
    fs.writeFileSync(destFileName, fs.readFileSync(sourceFileName))
}

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
const loadPartials = (basePath) =>
    _.reduce(mergeTextFilesByFileNameSync(findFilesSync(basePath, /.*/)),
        (acc, value, key) => {
            acc[_.last(key.split('/'))] = value
            return acc
        }, {})

/**
 * Process a Handlebars template and extrapolates with the given context data, and write into a file.
 *
 * @param {Object} context - The context data to fill into the template
 * @param {Object} opts    - The template options:
 *
 *      {
 *          sourceBaseDir: {String}     // The path to the directory of the templates and partials
 *          template: {String}          // The name of the main template file
 *          targetBaseDir: {String}     // The path to the directory of the target file
 *          target: {String}            // The name of the target file
 *      }
 *
 * @function
 */
exports.processTemplate = (context, opts) => {
    const templateFileName = path.resolve(opts.sourceBaseDir, opts.template)
    const resultFileName = path.resolve(opts.targetBaseDir, opts.target ? opts.target : opts.template)
    const rawTemplate = loadTextFileSync(templateFileName)

    handlebars.registerPartial(loadPartials(opts.sourceBaseDir))
    saveTextFileSync(resultFileName, handlebars.compile(rawTemplate)(context))
}

/**
 * Convert each markdown-format fields of the object to HTML
 *
 * @arg  {Object} doc - The document
 *
 * @return {Object} - A copy of the original document with processed markdown field values
 *
 * @function
 */
exports.convertMarkdown = (doc, mdProps) => {

    const getPropsDeep = function (obj, path='') {
        return _.flatMap(obj, function (value, key) {
            return _.isObject(value) ? getPropsDeep(value, path + key + '.') : path + key
        })
    }
    const propsToConvert = _.filter(getPropsDeep(doc), function (prop) {
        return _.includes(mdProps, _.last(prop.split('.')))
    })

    const convertedProps = _.reduce(propsToConvert, (acc, prop) => {
            if (_.hasIn(doc, prop)) {
                _.set(acc, prop, marked(_.get(doc, prop)))
            }
            return acc
        }, {})

    const result = _.merge({}, doc, convertedProps)
    //console.log('results: ', propsToConvert, JSON.stringify(convertedProps, null, '  '), JSON.stringify(result, null, '  '))
    return result
}
