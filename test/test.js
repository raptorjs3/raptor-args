'use strict';
var chai = require('chai');
chai.Assertion.includeStack = true;
require('chai').should();
var expect = require('chai').expect;


// var parser = require('../')
//     .createParser()
//     .usage('Usage: $0 [dependency1, dependency2, ...] [OPTIONS]')
//     .example('CSS minification', '$0 style.less --transform optimizer-minify-css')
//     .example('CSS and JavaScript minification', '$0 hello.js style.less --transforms optimizer-minify-css optimizer-minify-js')
//     .example('Plugin with config', '$0 hello.js style.less --plugins [ my-plugin -x 2 -y true ]')
//     .options({
//         '--dependencies --dependency -d *': 'string[]',
//         '--transforms --transform -t': 'string[]',
//         '--plugins --plugin -p': {
//             type: '[]',
//             options: {
//                 '--module -m *': null,
//                 '-*': null
//             }
//         }
//     });

describe('raptor-args' , function() {

    beforeEach(function(done) {
        done();
    });

    it('should allow for combination of default and boolean', function() {
        var parser = require('../')
            .createParser({
                '--dependencies --dependency -d *': 'string[]',
                '--minify -m': 'boolean'
            });

        // console.log('PARSER: ', require('util').inspect(parser, {depth: 100}));


        var parsed = parser.parse('foo bar --minify -d hello world'.split(/\s/));

        expect(parsed.dependencies).to.deep.equal([
            'foo', 'bar', 'hello', 'world'
        ]);
        expect(parsed.minify).to.equal(true);
    });

    it('should allow for boolean', function() {
        var parser = require('../')
            .createParser({
                '--dependencies --dependency -d *': 'string[]',
                '--minify -m': 'boolean'
            });

        var parsed = parser.parse('--minify'.split(/\s/));

        expect(parsed.dependencies).to.equal(undefined);
        expect(parsed.minify).to.equal(true);
    });

    it('should allow for boolean with explicit value', function() {
        var parser = require('../')
            .createParser({
                '--dependencies --dependency -d *': 'string[]',
                '--minify -m': 'boolean'
            });

        var parsed = parser.parse('--minify false'.split(/\s/));

        expect(parsed.dependencies).to.equal(undefined);
        expect(parsed.minify).to.equal(false);
    });

    it('should allow for negated boolean', function() {
        var parser = require('../')
            .createParser({
                '--dependencies --dependency -d *': 'string[]',
                '--minify -m': 'boolean'
            });

        var parsed = parser.parse('--no-minify'.split(/\s/));

        expect(parsed.dependencies).to.equal(undefined);
        expect(parsed.minify).to.equal(false);
    });

    it('should allow for dynamic args', function() {
        var parser = require('../')
            .createParser({
                '*': 'string',
                '-*': 'string',
                '--minify -m': 'boolean'
            });

        var parsed = parser.parse('foo --minify -f --hello world --no-bar --array 1 2'.split(/\s/));

        expect(parsed['*']).to.deep.equal(['foo']);
        expect(parsed.minify).to.equal(true);
        expect(parsed.f).to.equal(true);
        expect(parsed.hello).to.equal('world');
        expect(parsed.bar).to.equal(false);
        expect(parsed.array).to.deep.equal(['1', '2']);
    });

    it('should allow for combined short args', function() {
        var parser = require('../')
            .createParser({

                '--foo -f': 'boolean',
                '--bar -b': 'boolean',
                '--baz -z': 'boolean',
                '--hello -h': 'boolean'
            });

        var parsed = parser.parse('-fbz'.split(/\s/));

        // console.log('parsed: ', require('util').inspect(parsed, {depth: 100}));

        expect(parsed).to.deep.equal({
            foo: true,
            bar: true,
            baz: true
        });
    });

    it('should allow for complex args', function() {
        var parser = require('../')
            .createParser({
                '--minify -m': 'boolean',
                '--hello': 'string',
                '--plugins': {
                    options: {
                        '--module -m *': 'string',
                        '-*': null
                    }
                }
            });

        var parsed = parser.parse('--minify --plugins [ foo -x -y ] [ bar -z hello ] --hello world'.split(/\s/));

        // console.log('parsed: ', require('util').inspect(parsed, {depth: 100}));

        expect(parsed.minify).to.equal(true);
        expect(parsed.hello).to.equal('world');

        expect(parsed.plugins).to.deep.equal([
            {
                module: 'foo',
                x: true,
                y: true
            },
            {
                module: 'bar',
                z: 'hello'
            }
        ]);
    });

    it('should allow for empty string', function() {
        var parser = require('../')
            .createParser({
                '--hello -h': 'string'
            });

        var parsed = parser.parse(['--hello', '']);

        // console.log('parsed: ', require('util').inspect(parsed, {depth: 100}));

        expect(parsed).to.deep.equal({
            hello: ''
        });
    });

    it('should remove dashes', function() {
        var parser = require('../')
            .createParser({
                '--hello-world': 'string'
            });

        var parsed = parser.parse(['--hello-world', 'foo']);

        // console.log('parsed: ', require('util').inspect(parsed, {depth: 100}));

        expect(parsed).to.deep.equal({
            helloWorld: 'foo'
        });
    });

    it('should allow argument definition to start with "no-" prefix', function() {
        var parser = require('../')
            .createParser({
                '--no-conflict': 'string'
            });

        var parsed = parser.parse('--no-conflict myapp'.split(/\s/));

        expect(parsed.noConflict).to.equal('myapp');
    });

    it('should allow default values', function() {
        var parser = require('../')
            .createParser({
                '--foo -f': {
                    type: 'string',
                    defaultValue: 'bar'
                },
                '--bar -b': {
                    type: 'int',
                    defaultValue: 5
                },
                '--hello -h': {
                    type: 'string',
                    defaultValue: 'hello world'
                }
            });

        var parsed = parser.parse('--foo bor'.split(/\s/));

        expect(parsed).to.deep.equal({
            foo: 'bor',
            bar: 5,
            hello: 'hello world'
        });
    });

    it('should allow default values as functions', function() {
        var parser = require('../')
            .createParser({
                '--foo -f': {
                    type: 'string',
                    defaultValue: function() {
                        return 'bar';
                    }
                },
                '--bar -b': {
                    type: 'string'
                }
            });

        var parsed = parser.parse('--bar test'.split(/\s/));

        expect(parsed).to.deep.equal({
            foo: 'bar',
            bar: 'test'
        });
    });

    it('should call defaultValue function with Parser context', function() {
        var usage = 'Usage: test';
        var parser = require('../')
            .createParser({
                '--foo -f': {
                    type: 'string',
                    defaultValue: function() {
                        expect(this.getUsageString().indexOf(usage)).to.not.equal(-1);
                        return 'bar';
                    }
                },
                '--bar -b': {
                    type: 'string'
                }
            })
            .usage(usage);

        var parsed = parser.parse('--bar test'.split(/\s/));

        expect(parsed).to.deep.equal({
            foo: 'bar',
            bar: 'test'
        });
    });

    it('should allow default values use pseudo defaults', function() {
        var parser = require('../')
            .createParser({
                '--foo -f': {
                    type: 'string'
                },
                '--test -t': {
                    type: 'boolean',
                    defaultValue: 'y'
                }
            });

        var parsed = parser.parse('--foo bar'.split(/\s/));

        expect(parsed).to.deep.equal({
            foo: 'bar',
            test: true
        });
    });

    it('should receive error when default value is incorrect type', function() {
        var parser = require('../')
            .createParser({
                '--foo -f': {
                    type: 'string',
                },
                '--bar -b': {
                    type: 'int',
                    defaultValue: true
                }
            });

        expect(function() {
            parser.parse('--foo bor'.split(/\s/));
        }).to.throw(/Invalid default value \'true\' for target property \'bar\'/);
    });

    it('should allow default value using complex types', function() {
        var parser = require('../')
            .createParser({
                '--minify -m': 'boolean',
                '--hello': 'string',
                '--plugins': {
                    options: {
                        '--module -m *': 'string',
                        '-*': null
                    },
                    defaultValue: [
                        {
                            module: 'foo',
                            x: true,
                            y: true
                        },
                        {
                            module: 'bar',
                            z: 'hello'
                        }
                    ]
                }
            });

        var parsed = parser.parse('--minify --plugins [ foo -x -y ] [ bar -z hello ] --hello world'.split(/\s/));

        expect(parsed).to.deep.equal({
            minify: true,
            hello: 'world',
            plugins: [
                {
                    module: 'foo',
                    x: true,
                    y: true
                },
                {
                    module: 'bar',
                    z: 'hello'
                }
            ]
        });
    });

    it('should throw error if repeated option provided in parser', function() {
        expect(function() {
            require('../')
                .createParser({
                    '--minify -m': 'boolean',
                    '--minify -t': 'boolean'
                });
        }).to.throw(/Duplicate option provided \'--minify\'/);
    });

    it('should throw error if repeated alias provided in parser', function() {
        expect(function() {
            require('../')
                .createParser({
                    '--minify -m': 'boolean',
                    '--test -m': 'boolean'
                });
        }).to.throw(/Duplicate option provided \'-m\'/);
    });
});
