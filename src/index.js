#!/usr/bin/env node
/*jshint node: true */
'use strict';

/**
 * Universal generator module to create directories files and template based contents
 *
 * @module fgen
 */

import * as _ from 'lodash'
import handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import wrench from 'wrench'
import marked from 'marked'

import { loadTextFileSync, saveTextFileSync, findFilesSync, mergeTextFilesByFileNameSync } from 'datafile'

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

exports.copyDir = (opts) => {
    const sourceDirName = path.resolve(opts.sourceBaseDir, opts.dirName)
    const destDirName = path.resolve(opts.targetBaseDir, opts.dirName)

    console.log('Copy dir from: ' + sourceDirName + ' to: ' + destDirName)
    wrench.copyDirSyncRecursive(sourceDirName, destDirName, opts)
}

exports.copyFile = (fileName, sourceBaseDir, targetBaseDir) => {
    console.log('copyFile...' + fileName)

    const sourceFileName = path.resolve(sourceBaseDir, fileName)
    const destFileName = path.resolve(targetBaseDir, fileName)

    console.log('Copy file from: ' + sourceFileName + ' to: ' + destFileName)
    fs.writeFileSync(destFileName, fs.readFileSync(sourceFileName))
}

const loadPartials = (basePath) =>
    _.reduce(mergeTextFilesByFileNameSync(findFilesSync(basePath, /.*/)),
        (acc, value, key) => {
            acc[_.last(key.split('/'))] = value
            return acc
        }, {})

exports.processTemplate = (context, opts) => {
    const templateFileName = path.resolve(opts.sourceBaseDir, opts.template)
    const resultFileName = path.resolve(opts.targetBaseDir, opts.target ? opts.target : opts.template)
    const rawTemplate = loadTextFileSync(templateFileName)

    handlebars.registerPartial(loadPartials(opts.sourceBaseDir))
    saveTextFileSync(resultFileName, handlebars.compile(rawTemplate)(context))
}

/**
 * Converts each markdown-format fields of the object
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
