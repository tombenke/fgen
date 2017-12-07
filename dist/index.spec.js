#!/usr/bin/env node

/*jshint node: true */
'use strict';

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _index = require('./index');

var generator = _interopRequireWildcard(_index);

var _datafile = require('datafile');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var destCleanup = function destCleanup(cb) {
    var dest = _path2.default.resolve('./tmp/');
    (0, _rimraf2.default)(dest, cb);
};

before(function (done) {
    destCleanup(done);
});

after(function (done) {
    destCleanup(done);
    //    done()
});

describe('generator', function () {

    it('#createDirectoryTree() - Do not overwrite existing content', function (done) {
        (0, _expect2.default)(generator.createDirectoryTree('src/fixtures/target/toNotOverwrite/', ["services", "services/monitoring", "services/monitoring/isAlive"], false)).toEqual(false);
        done();
    });

    it('#createDirectoryTree() - Overwrite existing content', function (done) {
        // First it creates the non-existing tree
        (0, _expect2.default)(generator.createDirectoryTree('tmp/generator/target/toOverwrite/', ["services", "services/monitoring", "services/monitoring/isAlive"], true)).toEqual(true);

        // Then overwrites the previously created tree
        (0, _expect2.default)(generator.createDirectoryTree('tmp/generator/target/toOverwrite/', ["services", "services/monitoring", "services/monitoring/isAlive"], true)).toEqual(true);
        done();
    });

    it('#copyDir() - ', function (done) {
        done();
    });

    it('#copyFile() - ', function (done) {
        done();
    });

    it('#processTemplate() - ', function (done) {
        var context = {
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
        };

        generator.processTemplate(context, {
            sourceBaseDir: 'src/fixtures/templates/',
            targetBaseDir: 'tmp/',
            template: 'main.html'
        });
        done();
    });

    it('#convertMarkdown() - Convert markdown fields', function (done) {
        var mdProps = ['description', 'summary', 'details'];
        var dataToConvert = (0, _datafile.loadData)(['src/fixtures/services/customers/service.yml']);
        var result = generator.convertMarkdown(dataToConvert, mdProps);
        (0, _expect2.default)(result.description).toEqual("<p>This is the description of the service to <strong>customer</strong> collection resources</p>\n");
        (0, _expect2.default)(result.methods.GET.summary).toEqual("<p>List <em>all</em> the <strong>customers</strong></p>\n");
        done();
    });
});