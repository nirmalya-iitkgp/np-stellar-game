# NP Stellar Game

## Tech Stack
- **Language:** JavaScript
- **Framework:** React
- **Backend:** Node.js
- **Database:** MongoDB
- **Testing:** Jest

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/nirmalya-iitkgp/np-stellar-game.git
   ```
2. Navigate to the project directory:
   ```bash
   cd np-stellar-game
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Set up the environment variables necessary for the project. Create a `.env` file in the root directory and configure it as follows:
   ```bash
   DATABASE_URI=your_database_uri
   NODE_ENV=development
   ```
5. Start the development server:
   ```bash
   npm start
   ```

## Project Structure
```
np-stellar-game/
├── client/           # Frontend application
│   ├── public/       # Public assets
│   └── src/         # React components
├── server/           # Backend API
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── controllers/  # Business logic
├── tests/            # Test cases
└── README.md         # Project documentation
```

## Deployment Guide
1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `build/` directory to your preferred hosting provider (e.g., Heroku, AWS, etc.).
3. Ensure that your environment variables are set accordingly on the hosting platform.

## Contributing Guidelines
We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m 'Add my feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/my-feature
   ```
5. Open a pull request detailing your changes and the motivation behind them.

Thank you for considering contributing to the NP Stellar Game!