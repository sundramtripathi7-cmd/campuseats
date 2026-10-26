CAMPUS EATS FRONTEND — ADD TO YOUR EXISTING PROJECT

This package is an overlay, not a replacement for your backend.

1. In your existing folder:
   CampusEats/Assignment 5/catalogservice/
   copy the `templates` folder and `static` folder from this package.
   Final structure should include:
     catalogservice/templates/index.html
     catalogservice/static/css/style.css
     catalogservice/static/js/app.js

2. Open your existing app.py. Add this import near the other Flask imports:
     from flask import render_template
   If you already import from flask, add render_template to that existing import instead.

3. Add this route after `app = Flask(__name__)` (or anywhere before app.run):
     @app.get("/")
     def home_page():
         return render_template("index.html")
   Do NOT replace app.py; keep the existing REST and GraphQL routes.

4. Keep the existing GraphQL endpoint at POST /graphql and the demo auth token set in your project.
   The frontend sends Authorization: Bearer campuseats-demo-token for local coursework only.
   Never put a production secret in browser JavaScript.

5. Start the backend from the catalogservice folder:
     python app.py
   Open this in your browser:
     http://127.0.0.1:5000/

Features:
- Responsive HTML/CSS menu dashboard
- Fetches menuItems from GraphQL
- Search, category filter, availability filter
- Menu stats
- Create item GraphQL mutation
- Update availability GraphQL mutation

If the page opens but the API call fails, check browser DevTools Console and verify your /graphql endpoint's auth behavior and mutation field names match graphql_schema.py.
