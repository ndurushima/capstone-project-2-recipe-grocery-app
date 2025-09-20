Recipe & Grocery Planner


A full-stack app to search recipes, build weekly meal plans, and generate a consolidated shopping list.

Technologies Used
    Frontend: React (Vite), React Router, ky
    Backend: Flask, Flask-JWT-Extended, SQLAlchemy, Alembic
    Database: PostgreSQL (psycopg2)
    External API: Spoonacular
    Other: flask-cors, requests


Setup and Run Instructions

1) Backend (Flask)
    Prerequisites: Python 3.11+ and PostgreSQL running.
    Create server/.env (example):

    FLASK_APP=server.app:create_app
    FLASK_ENV=development
    FLASK_RUN_PORT=5555

    JWT_SECRET_KEY=change_me_for_dev
    DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/your_db

    # Spoonacular API key (either name works)
    SPOONACULAR_API_KEY=your_spoonacular_key
    # or
    # SPOONACULAR_KEY=your_spoonacular_key


    Install and run:

    cd server
    python -m venv .venv
    source .venv/bin/activate       # Windows: .venv\Scripts\activate
    pip install -r requirements.txt

    # Initialize/upgrade DB schema
    flask db upgrade

    # Start the API (http://localhost:5555)
    flask run --port 5555


2) Frontend (React)

    Prerequisites: Node 18+.

    cd client
    npm install
    npm run dev                      # http://localhost:5173


    The frontend expects the API at http://localhost:5555 (configured in client/src/api.js). If you change the API port, update that file accordingly.


Overview of Core Functionality

    Authentication with JWT (signup, login, persisted token in localStorage).

    Recipe search via Spoonacular and viewing detailed recipes (image, ingredients, instructions).

    Local recipe management (create, update).

    Weekly meal planning grid (Mon–Sun × breakfast/lunch/dinner/snack), add recipes to specific slots.

    Shopping list generation from the current plan with deduplication and filtering of instruction-like text.