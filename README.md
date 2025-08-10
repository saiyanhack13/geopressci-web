# Geopressci Web Application

This is the frontend application for Geopressci, built with React, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js (version 16 or higher)
- npm (version 8 or higher) or Yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd geopressci-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   # Add other environment variables here
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```
   Open [https://geopressci.netlify.app](https://geopressci.netlify.app) to view it in your browser.

## Available Scripts

- `npm start` - Start the development server
- `npm test` - Run tests
- `npm run build` - Build the app for production
- `npm run eject` - Eject from Create React App (one-way operation)

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

This will create a `build` directory with the production-ready files.

## Docker Support

You can build and run the application using Docker:

1. **Build the Docker image**
   ```bash
   docker build -t geopressci-web .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:80 geopressci-web
   ```

## Deployment

This application is configured to be deployed to Netlify. To deploy:

1. Push your code to a GitHub repository
2. Connect the repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Add environment variables as needed

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000` |
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API key | (required for map features) |

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

[Specify License]
