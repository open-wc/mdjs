---
layout: layout.njk
title: Introducing mdjs - live demos everywhere
published: false
description: Combine markdown and javascript to create the ultimate documentation to allow live demos everywhere.
tags: markdown, javascript, webcomponents, demos
cover_image: https://github.com/open-wc/blog-posts/blob/2019-11-storybook-for-web-components/2019-11-storybook-for-web-components-on-steroids/images/nong-vang-9pw4TKvT3po-unsplash.jpg?raw=true
---

Every shared code needs had written documentation to show what it can be used for and what the idea behind is.
Users should at least on the high level understand what the are using for what and why.

On the web, we have many many different ways of writing documentation.
However, one thing almost all of them have in common is that they rely on [Markdown](https://en.wikipedia.org/wiki/Markdown) or of variations of it.

It is supported literally everywhere (vscode, atom, github, gitlab, dev.to, npmjs, ...)

## For tools that do not run in the browser

In that case, you will mostly share code snippets that people will need to run in their own projects so traditional static site generators like [Docusaurus](https://docusaurus.io/), [VuePress](https://vuepress.vuejs.org/), [Gatsby](https://www.gatsbyjs.org/), ... work great. All of them have full support for Markdown and therefore can create beautiful documentation pages with code snippets/highlighting, ...

Honestly, if that is your use case almost everything should be possible as long as you feel comfortable with the tools ecosystem/framework.

## For (visual) components that do run in the browser

Here people do expect a live demo to see different options in action. So pure Markdown is usually not enough as we now want to actually execute code and "insert" our working component. This requires specialized handling for each framework.

### Vue

For Vue you can use for example VuePress which auto registers all vue components in a certain folder and then you can use as normal html tags as Markdown allows html

```
.
└─ .vuepress
  └─ components
      ├─ demo-1.vue
```

```html
<demo-1 />
```

- supports vue components and has "magical" import for them
- no support for generic javascript or passing properties to components

### React

For React you can use [mdx](https://mdxjs.com/) which extends Markdown with JSX support. Mdx is available via multiple tools like [Gatsby](https://www.gatsbyjs.org/), [docz](https://www.docz.site/), [storybook](https://storybook.js.org/), ...

```md
import { Chart } from '../components/chart'

# Here’s a chart

The chart is rendered inside our MDX document.
<Chart />
```

- supports import/export JavaScript
- passes everything through JSX
- looks "bad" on github, requires special tools in editors to get highlighting

## Limitations

What all these specialized tools have in common is that they require a specific build tooling setup to work.
For web components, none of that is actually needed. Markdown already allows for HTML. The only missing piece is how to load a web component?

## Introducing Markdown with JavaScript (mdjs)

The primary goals are

- minimal complexity
- follows progressive enhancement
- markdown needs to still make sense
- code highlighting in editors without additional tools
- looks good on github/gitlab/any source code management tool

The fundamental idea is laughable simple. We "enhance" a code fence block with additional meta data `js script`.

    ```js script
    import './my-component.js';
    ```
    # This is my component
    <my-component></my-component>

And that's it 😅

Enough talk you can see it here live:

[==> Link to editable demo <==](https://webcomponents.dev/edit/aPQdZ4FtAiqJ7YXnRe2s?pm=1&sv=1)

**How does it work**

Mdjs hooks into [remark](https://remark.js.org/) and extracts all those tagged js blocks.
In the end, html and js is separately available.

```js
{
  html: '<h1>This is my component</h1><my-component></my-component>',
  jsCode: "import './my-component.js';"
}
```

It can then be combined/processed by any tool to create an actual documentation page.

The process looks like this:

1. Extract `js script` and separate it from md
2. Render md
3. Provide html & js

==> INSERT ANIMATION <==

This already is powerful enough to directly include JavaScript and render web components with attributes.

## Enhancing mdjs with demo format

Now that we can execute JavaScript within our Markdown this opens the door for more advanced features.

Our first step is to create another enhanced js code block `js preview-story`.
In there you should export a function that can be executed on demand.
This will add a border around and a button to show/hide the actual source code.

    ```js script
    import './my-component.js';
    ```
    # This is my component
    ```js preview-story
    export const demo = () => `<my-component header="from attribute"></my-component>`
    ```

> if you do not want to border and button you can use `js story`

What you get looks something like this

```js
{
  html: '<h1>This is my component</h1><my-component></my-component>',
  jsCode: "import './my-component.js';",
  stories: [
    key: 'demo',
    name: 'demo',
    code: 'export const demo = () => `<my-component header="from attribute"></my-component>`',
  ]
}
```

This adds an extra step to the processing:

1. Extract `js script` and separate from md
2. Extract `js story` and `js preview-story` and separate from md
3. Put a placeholder `<mdjs-story mdjs-story-name="demo"></mdjs-story>` or `mdjs-preview` at it's place
4. Render md
5. Provide html & js & stories

With that information you can now create full javascript and demo capable pages purely from markdown.

By default Mdjs takes it a small step further by supporting an actual template system - namely [lit-html](https://lit-html.polymer-project.org/).

    ```js script
    import './my-component.js';
    import { html } from 'lit-html';

    const name = 'from variable';
    ```
    # This is my component
    ```js story
    export const demo = () => html`
      <my-component .header=${name}></my-component>
    `;
    ```

==> INSERT ANIMATION <==

Here another playground mimicking a full documentation page.

[==> Link to editable demo <==](https://webcomponents.dev/edit/PqrQkg3abvFJ7vxyZuqa?pm=1&sv=1)

## mdjs default docs page

Once all this meta-information is available you can render a specific docs page.

It basically comes down to generating this code which assigns the demo function to the actual web component.

```js
const stories = [{ key: 'demo', story: demo, code: demo }];
for (const story of stories) {
  const storyEl = rootNode.querySelector(`[mdjs-story-name="${story.key}"]`);
  storyEl.story = story.story;
  storyEl.code = story.code;
}
```

All of this happens under the hood for you 🤗

## Where can you use mdjs?

### You can use it locally via es-dev-server

This will create a github like markdown view for all your local markdown files including live demos.

![es-dev-server screenshot](https://raw.githubusercontent.com/open-wc/blog-posts/feat/mdjs/2020-04-introducing-mdjs-live-demos-everywhere/images/es-dev-server-screenshot.png)

- Add to your `package.json`:

  ```json
  "scripts": {
    "start": "es-dev-server",
  }
  ```

- Create a `es-dev-server.config.js` in the root of your repo.

  ```js
  const { mdjsTransformer } = require('@mdjs/core');

  module.exports = {
    nodeResolve: true,
    open: 'README.md',
    watch: true,
    responseTransformers: [mdjsTransformer],
  };
  ```

After executing `npm run start` you can happily browse you live documentation via [http://localhost:8000/README.md](http://localhost:8000/README.md).

You can see an example setup in the [demo-wc-card repo](https://github.com/daKmoR/demo-wc-card).

### You can use it via storybook

If you want to work on individual components or get a list of all demos you can use storybook.

![storybook screenshot](https://raw.githubusercontent.com/open-wc/blog-posts/feat/mdjs/2020-04-introducing-mdjs-live-demos-everywhere/images/storybook-screenshot.png)

- Install dependencies `npm i -D @open-wc/demoing-storybook`

- Add to your `package.json`:

  ```json
  "scripts": {
    "storybook": "start-storybook --experimental-md-docs",
  }
  ```

- Adjust your `.storybook/main.js` to load markdown files

  ```js
  module.exports = {
    stories: ['../README.md', '../docs/**/*.md'],
    esDevServer: {
      nodeResolve: true,
      watch: true,
      open: true,
    },
  };
  ```

- Add to every markdown file that should be in storybook a name via

  ```js
  export default {
    title: 'My Group/My Awesome Component',
  };
  ```

With that, you are good to go.
No additional changes to any files are needed a plugin will take care of it by converting your markdown files to the support mdx format of storybook.

For more detailed information please see [https://open-wc.org/demoing-storybook/](https://open-wc.org/demoing-storybook/).

### Show it on github

Github supports markdown out of the box and with this format we can go one step further.

As it's not (yet - let's ask 😬) supported by github directly you will need a chrome extension called [mdjs-viewer](https://chrome.google.com/webstore/detail/mdjs-viewer/ifkkmomkjknligelmlcnakclabgohafe).

You wanna see a demo without opening a different page? mdjs-viewer
You wanna show a live example of the issue you are having? mdjs-viewer

==> INSERT SCREENSHOT/GIF/VIDEO <==

It sure looks like black magic.
Install a chrome extension and suddenly github gets superpowers.

All that is needed is to have Markdown files with the correct code fence blocks.
And yeah your code needs to be able to run from within [unpkg.com](https://unpkg.com).

**How does it actually work?**

The extension detects on which github page you are.
If it actually finds a markdown file or an issue with mdjs code then it adds a "show demo" button to can active it.
Only if you click the button it will start gathering all the needed info.

- find the nearest `package.json`
- read the actual markdown file/issue content
- replace all bare import with `unpkg.com` imports
- replace all relative imports with `unpkg.com` and the name of the package.json + relative path for it
- create a secured iframe
- position the iframe absolute as an overlays
- put the jsCode and html code inside the iframe
- the button becomes a toggle to show/hide the iframe

Some of the tasks are more complicated and require some extra work to make it secure but in the sense that's it.

With that, you can put documentation with live examples on github.
Even issues with demos showing the actual error in the code are possible.

That sure sounds like a hell of a tool to improve your documentation an issue reproduction.
Especially as the readme & issue content still remain useful even without the extension.

### Supported on webcomponents.dev

Fully supported by this awesome online editor.

![webcomponent.dev screenshot](https://raw.githubusercontent.com/open-wc/blog-posts/feat/mdjs/2020-04-introducing-mdjs-live-demos-everywhere/images/webcomponents-dev-screenshot.png)

As in the screenshot above you can start directly with documentation.

Or even better you can use it in every Markdown file or README.md 💪

Give it a go and document your components in all it's glory.

All the demo links are actually from [webcomponents.dev](https://webcomponents.dev/edit/collection/lsZ2eaviDNwy6pIBEDeL/tS7JYfymt6yeshma8Gn1?pm=1&sv=1).

Be sure to [check it out](https://webcomponents.dev/).

## How you can add support for mdjs

Please check the official documentation page at [https://open-wc.org/mdjs/](https://open-wc.org/mdjs/).

## Resume

There you have it - mdjs is a format that can be shown in many different ways.
It is your single source of truth for good looking documentation everywhere.
Be it your locally, a published storybook, on github or npmjs it always looks good even if there is no direct support for it. If possible it will become interactive demos through progressive enhancement.

Now go out there and write good documentation for your components.

## Future

- Have a separate github repo (potentially group as well).
- Have a dedicated homepage
- The default story preview frame should look a little nicer
- Highlighting of code snippets
- More helpers to be used within stories
- ... (feel free to open issues within the corresponding projects)

## Acknowledgements

Follow us on [Twitter](https://twitter.com/openwc), or follow me on my personal [Twitter](https://twitter.com/dakmor).
Make sure to check out our other tools and recommendations at [open-wc.org](https://open-wc.org).

Thanks to [Benny](https://dev.to/bennypowers) and [Lars](https://github.com/LarsDenBakker) for feedback and helping turn my scribbles to a followable story.

Cover Photo by [Nong Vang](https://unsplash.com/@californong) on [Unsplash](https://unsplash.com/)