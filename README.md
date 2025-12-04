# Umbraco Power Tools

A browser extension for Umbraco developers that helps you quickly navigate between the Umbraco admin panel and site root, plus stay connected with the Umbraco community.

## Features

- **Quick Navigation**: Toggle between `/umbraco` admin panel and site root (`/`) with a single click
- **Community Feed**: View latest posts from Umbraco Forum and Mastodon (#Umbraco)
- **Quick Links**: Fast access to Forum, Docs, and Community sites
- **Theme Support**: Light/Dark/Auto theme modes
- **Configurable**: Open links in new tab or current tab

## Installation

### From Browser Extension Stores

- [Chrome Web Store](#) (Coming soon)
- [Firefox Add-ons](#) (Coming soon)
- [Edge Add-ons](#) (Coming soon)

### Manual Installation (Development)

#### Chrome/Edge
1. Clone this repository
2. Run `npm install` and `npm run generate-icons` to generate icon files
3. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge)
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select the extension directory

#### Firefox
1. Clone this repository
2. Run `npm install` and `npm run generate-icons` to generate icon files
3. Open `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file

## Development

### Prerequisites
- Node.js (for icon generation)

### Setup
```bash
# Install dependencies
npm install

# Generate icon files from SVG
npm run generate-icons
```

### Project Structure
```
.
├── manifest.json          # Extension manifest (cross-browser)
├── popup.html            # Main popup interface
├── popup.js              # Popup logic
├── options.html          # Settings page
├── options.js            # Settings logic
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon.svg         # Source SVG
│   └── *.png            # Generated PNG icons
└── generate-icons.js     # Icon generator script
```

### Building for Production

The GitHub Actions workflow automatically builds and packages the extension when you create a release:

```bash
# Tag a new version
git tag v1.0.0
git push origin v1.0.0
```

This will create a release with `umbraco-power-tools.zip` ready for submission to extension stores.

## Publishing to Extension Stores

### Chrome Web Store
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create a new item and upload `umbraco-power-tools.zip`
3. Fill in store listing details
4. Submit for review

### Firefox Add-ons
1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Submit a new add-on
3. Upload `umbraco-power-tools.zip`
4. Fill in listing details
5. Submit for review

### Microsoft Edge Add-ons
1. Go to [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
2. Create a new submission
3. Upload `umbraco-power-tools.zip`
4. Complete the submission form
5. Submit for certification

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Privacy

This extension respects your privacy and does not collect any personal information. See our [Privacy Policy](PRIVACY.md) for complete details.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Credits

Created with ❤️ for the Umbraco community

## Support

- Report bugs: [GitHub Issues](https://github.com/yourusername/umbraco-power-tools/issues)
- Umbraco Forum: [forum.umbraco.com](https://forum.umbraco.com)
- Umbraco Docs: [docs.umbraco.com](https://docs.umbraco.com)
