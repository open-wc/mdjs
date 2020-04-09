module.exports = function (eleventyConfig) {
    let markdownIt = require('markdown-it');
    let options = {
        html: true,
    };

    eleventyConfig.setLibrary('md', markdownIt(options));

    return {
        dir: { input: 'content', output: 'live' },
        passthroughFileCopy: true,
        templateFormats: ['njk', 'md', 'css', 'yml'],
        htmlTemplateEngine: 'njk',
    };
};