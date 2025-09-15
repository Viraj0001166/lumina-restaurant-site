<div align="center">
  <h1>🍽️ Lumina Restaurant</h1>
  <p>An elegant, interactive restaurant website with 3D elements and smooth animations</p>
  
  [![Netlify Status](https://api.netlify.com/api/v1/badges/lumina-restaurant/deploy-status)](https://app.netlify.com/sites/lumina-restaurant/deploys)
  ![GitHub last commit](https://img.shields.io/github/last-commit/Viraj0001166/lumina-restaurant-site)
  ![GitHub repo size](https://img.shields.io/github/repo-size/Viraj0001166/lumina-restaurant-site)
  
  [Live Demo](https://lumina-restaurant.netlify.app) • [Report Bug](https://github.com/Viraj0001166/lumina-restaurant-site/issues) • [Request Feature](https://github.com/Viraj0001166/lumina-restaurant-site/issues)
</div>

## ✨ Lumina Restaurant Features

- **Immersive 3D Dining Experience** - Interactive 3D elements that respond to user interactions
- **Responsive Design** - Works flawlessly on all devices from mobile to desktop
- **Password Protection** - Secure access control with Netlify Edge Functions
- **Performance Optimized** - Fast loading with optimized assets and lazy loading
- **Modern UI/UX** - Clean, elegant design with smooth animations and transitions
- **SEO Friendly** - Proper meta tags and semantic HTML for better search visibility

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Viraj0001166/lumina-restaurant-site.git
   cd lumina-restaurant-site
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run locally with Netlify CLI**
   ```bash
   # Install Netlify CLI globally (if not already installed)
   npm install -g netlify-cli
   
   # Start local development server
   netlify dev
   ```
   Open [https://lumina-restaurant.netlify.app/](https://lumina-restaurant.netlify.app/) in your browser.

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Deploy to Netlify**
   ```bash
   # Login to Netlify (if not already logged in)
   netlify login
   
   # Deploy to a new site
   netlify deploy --prod
   ```

## 🔒 Password Protection

To enable password protection in production:

1. Set these environment variables in your Netlify dashboard:
   ```
   SITE_PASSWORD=your_secure_password
   PW_TTL_SECONDS=300  # Session duration in seconds (0 = ask on every page load)
   SHOW_PASSWORD_HINT=false  # Set to true to show password hint in development
   ```

## 🛠️ Tech Stack for Lumina Restaurant

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Effects**: CSS 3D Transforms, Custom JavaScript
- **Build Tools**: Node.js, npm scripts
- **Hosting**: Netlify (with Edge Functions for auth)
- **Performance**: Lazy loading, optimized assets, minimal dependencies

## 📱 Responsive Design

- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Reduced motion preferences respected
- Optimized images and assets

## 🎨 Design Philosophy

- **Minimalist Aesthetic** - Clean, uncluttered interface
- **Immersive Experience** - 3D elements create depth and engagement
- **Intuitive Navigation** - Easy-to-use menu and page transitions
- **Performance First** - Optimized animations and assets for smooth experience

## 📂 Project Structure

```
.
├── assets/
│   ├── css/           # Stylesheets
│   └── js/            # JavaScript files
├── netlify/
│   └── edge-functions/ # Authentication logic
├── tools/             # Build scripts
├── .gitignore
├── index.html
├── netlify.toml       # Netlify configuration
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

- **Viraj Srivastav**
  - [GitHub](https://github.com/Viraj0001166)
  - [LinkedIn](https://linkedin.com/in/viraj-srivastav)
  - [Taliyo Technologies](https://taliyotechnologies.com/Projects) - Web Developer

## 🙏 Acknowledgments

- Developed as part of [Taliyo Technologies](https://taliyotechnologies.com)
- Fonts: [Google Fonts](https://fonts.google.com/)
- Icons: [Font Awesome](https://fontawesome.com/)
- Inspiration: Modern web design trends and 3D web experiences

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/Viraj0001166">Viraj Srivastav</a>
</div>
