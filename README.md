# BookNest — Online Book Library

BookNest is a full-stack web application for browsing a book catalogue and signing in to access the application's book features.

## Live Demo

- **Frontend:** https://booknest-fronted.netlify.app
- **Backend API:** https://booknestbckend.onrender.com
- **Books API:** https://booknestbckend.onrender.com/api/books

## Technology Stack

- **Frontend:** React, Vite, JavaScript, Axios
- **Backend:** Java 21, Spring Boot, REST API
- **Security:** Spring Security and JWT-based authentication
- **Deployment:** Netlify (frontend), Render (backend)

## Features

- User login with JWT-based authentication
- Book catalogue loaded from the backend API
- Book information including title, author, category, ISBN, description, and copy availability
- API-based frontend/backend integration

> The deployed books endpoint currently returns five sample catalogue records. Verify any additional actions (such as borrowing, registration, or account persistence) in the live application before presenting them as completed features.

## Run Locally

### Frontend

1. Install Node.js (LTS).
2. Clone this repository and open the frontend project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file if you need to override the API URL:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Create a production build:
   ```bash
   npm run build
   ```

The deployed frontend uses `https://booknestbckend.onrender.com/api` as its production API base URL unless `VITE_API_URL` is set.

## Deployment

- Netlify publishes the Vite production build from the `dist` directory.
- The Spring Boot backend is hosted separately on Render.
- The backend must allow the frontend's origin through its CORS configuration.
- Keep credentials and JWT secrets in deployment environment variables. Never commit secrets to GitHub.

## Final Verification Checklist

- [ ] Live frontend opens without a build error.
- [ ] User can log in with valid credentials.
- [ ] Invalid credentials show a useful error.
- [ ] Book catalogue displays the records returned by the API.
- [ ] Search/filter works, if enabled in the UI.
- [ ] Book actions work, if enabled in the UI.
- [ ] Logout works and protected pages require authentication.
- [ ] Refreshing the page does not cause unexpected authentication errors.
- [ ] Test on desktop and mobile-sized screens.
- [ ] No passwords, API keys, or JWT secrets are committed to the repository.

## Repositories

- Frontend: https://github.com/24eg107f23-gif/BookNestFronted
- Backend: https://github.com/24eg107f23-gif/BookNestBckend

## Notes

The frontend and backend are deployed as separate services. The backend's database configuration is controlled by environment variables; confirm the production database provider and persistence settings before relying on stored user or catalogue data long-term.
