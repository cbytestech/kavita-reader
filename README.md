# 📚 KavitaReader

<div align="center">

![KavitaReader](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-Android-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg?logo=expo)

**A beautiful, modern mobile reader for your self-hosted Kavita server**

*Built with ❤️ as a Christmas gift for Emily, my wonderful wife and fellow reader*

[Features](#features) • [Screenshots](#screenshots) • [Installation](#installation) • [Development](#development) • [License](#license)

</div>

---

## 🎁 About This Project

KavitaReader was created as a Christmas 2024 gift for my wife Emily, an avid reader who deserves the best mobile experience for her digital library. What started as a simple idea became a full-featured reader app that brings the power of Kavita to Android devices everywhere.

This app is built with love, late nights, and lots of coffee ☕

---

## ✨ Features

### 📖 Comprehensive Format Support
- **EPUB** - Full book support with chapter navigation
- **PDF** - Smooth document reading experience
- **CBZ/CBR/CB7** - Comic and manga archives
- **Images** - Direct image-based reading

### 🎨 Beautiful Reading Experience
- 🌙 **Dark Mode** - Comfortable reading day or night
- 👁️ **Grayscale Mode** - Reduce eye strain during long sessions
- 📏 **Adjustable Font Sizes** - Perfect for EPUB reading
- 🔊 **Page Turn Sounds** - Optional audio feedback (can be disabled)

### 🔄 Smart Synchronization
- 📊 **Progress Tracking** - Sync your reading progress with Kavita
- 🔖 **Resume Reading** - Pick up exactly where you left off
- 🔄 **Real-time Sync** - Progress updates automatically

### 🌐 Flexible Connectivity
- 🏠 **Local IP Connection** - Connect to your home server
- 🌍 **OPDS Support** - Remote access via OPDS feeds
- 🖥️ **Multiple Servers** - Manage multiple Kavita libraries
- 🔐 **Secure Authentication** - Your credentials stay safe

### 🎯 User-Friendly Interface
- 🔍 **Search** - Find books instantly across your library
- 📚 **Library Organization** - Browse by series, recently added, or A-Z
- 🎨 **Cover Art Display** - Beautiful visual library browsing
- 🏷️ **File Type Badges** - Clear indicators for each format
- 📈 **Progress Indicators** - Visual tracking of reading progress

### 🔒 Privacy First
- ✅ **Zero Data Collection** - We don't collect anything
- ✅ **No Analytics** - Your reading habits stay private
- ✅ **No Ads** - Clean, distraction-free experience
- ✅ **Local Storage Only** - Data stays on your device and server

---

## 📱 Screenshots

<div align="center">

| Library View | Settings Menu | Reader | <p>
<img width="270" height="615" alt="Screenshot_20251201-134752" src="https://github.com/user-attachments/assets/a6662b75-0fa3-43af-b3ff-fe85e4283235" />
<img width="270" height="615" alt="Screenshot_20251201-134805" src="https://github.com/user-attachments/assets/a7857373-60f4-4e63-bc3f-621abe974bec" />
<img width="270" height="615" alt="Screenshot_20251201-134735" src="https://github.com/user-attachments/assets/5f3f325f-0733-44c4-aad2-448bb0ae5078" />



</div>

---

## 🚀 Installation

### For Users

**Google Play Store** (Recommended)
```
Coming Soon - December 2024
```

**Direct APK Download**
1. Download the latest APK from [Releases](https://github.com/cbytestech/kavita-reader/releases)
2. Enable "Install from Unknown Sources" on your Android device
3. Install the APK
4. Connect to your Kavita server and enjoy!

### Requirements
- Android 5.0 (Lollipop) or higher
- A self-hosted [Kavita](https://www.kavitareader.com/) server (v0.7.0+)
- Network access to your Kavita server

---

## 🛠️ Development

### Tech Stack
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build platform
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **Zustand** - State management
- **React Native Paper** - Material Design components

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
expo-cli
```

### Setup

```bash
# Clone the repository
git clone https://github.com/cbytestech/kavita-reader.git
cd kavita-reader

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

### Project Structure
```
kavita-reader/
├── src/
│   ├── api/           # Kavita API client
│   ├── components/    # Reusable components
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # Screen components
│   ├── stores/        # Zustand state stores
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── assets/            # Images, icons, fonts
├── app.json          # Expo configuration
└── package.json      # Dependencies
```

### Building

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

---

## 🎨 Theming

KavitaReader supports two beautiful themes:

### Homestead Theme (Default)
Inspired by our brand colors - warm, earthy, and comfortable for reading.
- Primary: Dark Green (`#3D4A2C`)
- Accent: Rust Orange (`#C86438`)

### Pipboy Green Theme
For the tech enthusiasts - terminal-style retro green aesthetic.
- Primary: Pipboy Green (`#00FF41`)
- Perfect for Nova Launcher customization

---

## 🤝 Contributing

While this started as a personal project for Emily, contributions and suggestions are warmly welcomed!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🗺️ Roadmap - Planned Features

Features I'm planning to add:

- [ ] 🎧 **Audiobook Support** - Play audiobooks from your Kavita library
- [ ] 🎯 **Reading Goals** - Set and track daily/weekly/monthly reading targets
- [ ] 🔔 **Library Update Notifications** - Get notified when new content is added to your server
- [ ] 📊 **Reading Statistics** - Detailed analytics of your reading habits
- [ ] 🔖 **Enhanced Bookmarks** - Add notes and highlights to your books
- [ ] 🌍 **iOS Version** - Bring KavitaReader to iPhone and iPad
- [ ] 🎨 **Custom Themes** - Create your own color schemes
- [ ] 📱 **Tablet Optimization** - Enhanced layouts for larger screens

### Open to Suggestions!

Have an idea for a feature? [Open an issue](https://github.com/cbytestech/kavita-reader/issues) with the tag `enhancement` and let's discuss it!

### Areas for Contribution
- [ ] Additional file format support
- [ ] iOS version
- [ ] Localization/translations
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] UI/UX enhancements

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea? Please [open an issue](https://github.com/cbytestech/kavita-reader/issues)!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Kavita](https://www.kavitareader.com/)** - The amazing self-hosted digital library that powers this app
- **Emily** - My inspiration and first user. Merry Christmas, love! 🎄❤️
- **The React Native Community** - For incredible tools and libraries
- **Expo Team** - For making mobile development accessible
- **Claude (Anthropic)** - For helping bring this project to life

---

## 🔗 Links

- **Kavita Project**: https://www.kavitareader.com/
- **Kavita GitHub**: https://github.com/Kareadita/Kavita
- **Support**: [Open an Issue](https://github.com/cbytestech/kavita-reader/issues)
- **Privacy Policy**: [View Policy](https://cbytestech.github.io/kavita-reader-privacy/)

---

## 💝 A Note to Emily

This app was built during countless late nights and early mornings, powered by your encouragement and my desire to give you the best reading experience possible. Every feature was designed with you in mind - from the comfortable dark mode for your late-night reading sessions, to the progress tracking so you never lose your place.

Thank you for being patient with all the "just one more feature!" moments and for being my biggest supporter. I hope KavitaReader brings you as much joy using it as I had creating it for you.

All my love,  
Norm

Merry Christmas 2024 🎄📚❤️

---

<div align="center">

**Made with ❤️ by [Norm](https://github.com/cbytestech)**

**Hess Homestead** • **2024**

⭐ If you find this project useful, please consider giving it a star!

💡 **Open to suggestions!** Have an idea? [Create an issue](https://github.com/cbytestech/kavita-reader/issues) and let's make KavitaReader even better together.

</div>
