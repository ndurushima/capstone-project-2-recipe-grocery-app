import bcrypt
from . import db


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    _paasword_hash = db.Column(db.String(100), nullable=False)

    recipes = db.relationship("Recipe", backref="user", cascade="all, delete-orphan")
    meal_plans = db.relationship("MealPlan", backref="user", cascade="all, delete-orphan")

    @property
    def password_hash(self):
        raise AttributeError("Password hashes may not be viewed.")
    
    @password_hash.setter
    def password_hash(self, password):
        self._password_hash = bcrypt.generate_password_hash(password.encode("utf-8")).decode("utf-8")

    def authenticate(self, pw):
        return bcrypt.check_password_hash(self._password_hash, pw.encode("utf-8"))

    def to_dict(self):
        return {
            "id": self.id, 
            "email": self.email, 
            "username": self.username
        }


class Recipe(db.Model):
    __tablename__ = "recipes"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    ingredients = db.Column(db.Text, nullable=False)
    steps = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "ingredients": self.ingredients,
            "steps": self.steps,
        }


class MealPlan(db.Model):
    __tablename__ = "meal_plans"
    id 

