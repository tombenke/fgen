#!/usr/bin/env node
/*jshint node: true */
'use strict';

import rimraf from 'rimraf'
import path from 'path'
import expect from 'expect'
import * as generator from './index'
import { loadData } from 'datafile'

const destCleanup = function(cb) {
    const dest = path.resolve('./tmp/')
    rimraf(dest, cb)
}

before(function(done) {
    destCleanup(done)
})

after(function(done) {
    destCleanup(done)
})

describe('generator', function() {

    it('#createDirectoryTree() - Do not overwrite existing content', function(done) {
        expect(generator.createDirectoryTree('src/fixtures/target/toNotOverwrite/', [
                "services",
                "services/monitoring",
                "services/monitoring/isAlive"
            ], false)).toEqual(false)
        done()
    })

    it('#createDirectoryTree() - Overwrite existing content', function(done) {
        // First it creates the non-existing tree
        expect(generator.createDirectoryTree('tmp/generator/target/toOverwrite/', [
                "services",
                "services/monitoring",
                "services/monitoring/isAlive"
            ], true)).toEqual(true)

        // Then overwrites the previously created tree
        expect(generator.createDirectoryTree('tmp/generator/target/toOverwrite/', [
                "services",
                "services/monitoring",
                "services/monitoring/isAlive"
            ], true)).toEqual(true)
        done()
    })

    it('#copyDir() - ', function(done) {
        done()
    })

    it('#copyFile() - ', function(done) {
        done()
    })

    it('#processTemplate() - ', function(done) {
        const context = {
            projectName: "rest-tool-common",
            itemsToList: [{
                uri: 'http://www.google.com',
                name: 'Google'
            }, {
                uri: 'http://www.amazon.com',
                name: 'Amazon'
            }, {
                uri: 'http://www.heroku.com',
                name: 'Heroku'
            }]
        }

        generator.processTemplate(context, {
            sourceBaseDir: 'src/fixtures/templates/',
            targetBaseDir: 'tmp/',
            template: 'main.html'
        })
        done()
    })

    it('#convertMarkdown() - Convert markdown fields', function(done) {
        const mdProps = ['description', 'summary', 'details']
        const dataToConvert = loadData(['src/fixtures/services/customers/service.yml'])
        const result = generator.convertMarkdown(dataToConvert, mdProps)
        expect(result.description).toEqual("<p>This is the description of the service to <strong>customer</strong> collection resources</p>\n")
        expect(result.methods.GET.summary).toEqual("<p>List <em>all</em> the <strong>customers</strong></p>\n")
        done()
    })
})
