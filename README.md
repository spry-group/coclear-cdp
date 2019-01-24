# coclear-cdp
An interactive radial stacked bar chart depicting cdp product data

# Development

```bash
# update cached cached data
npm run update-data

# each of these will need to be ran in a separate console.
# TODO: make this easier.
npm run serve
npm run livereload
npm run sass
```

# Deployment

We're using static encryption before launch: https://github.com/robinmoisson/staticrypt
```bash
# need to install global, not listed in project dependencies.
staticrypt index.html passwordHere
```