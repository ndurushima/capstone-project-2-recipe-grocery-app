from .extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    _password_hash = db.Column(db.String(100), nullable=False)

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
    steps = db.Column(db.Text)

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
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    week_start = db.Column(db.Date, nullable=False)

    items = db.relationship("MealItem", backref="meal_plan", cascade="all, delete-orphan")
    shopping_items = db.relationship("ShoppingItem", backref="meal_plan", cascade="all, delete-orphan")

    def to_dict(self, include_items=False, include_shopping=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "week_Start": self.week_start.isoformat()
        }
        if include_items:
            data["items"] = [items.to_dict() for items in self.items]
        if include_shopping:
            data["shopping_items"] = [shopping.to_dict() for shopping in self.shopping_items]
        return data
    

class MealItem(db.Model):
    __tablename__ = "meal_items"
    id = db.Column(db.Integer, primary_key=True)
    meal_plan_id = db.Column(db.Integer, db.ForeignKey("meal_plans.id"), nullable=False)
    recipe_id = db.Column(db.Integer, db.ForeignKey("recipes.id"), nullable=True)
    day = db.Column(db.String(10), nullable=False) 

    # breakfast/lunch/dinner/snack
    meal_type = db.Column(db.String(20), nullable=False) 
    
    recipe = db.relationship("Recipe")

    def to_dict(self):
        return {
            "id": self.id,
            "meal_plan_id": self.meal_plan_id,
            "recipe_id": self.recipe_id,
            "day": self.day,
            "meal_type": self.meal_type,
            "recipe": self.recipe.to_dict() if self.recipe else None
        }
    

class ShoppingItem(db.Model):
    __tablename__ = "shopping_items"
    id = db.Column(db.Integer, primary_key=True)
    meal_plan_id = db.Column(db.Integer, db.ForeignKey("meal_plans.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.String(50))
    checked = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "meal_plan_id": self.meal_plan_id,
            "name": self.name,
            "quantity": self.quantity,
            "checked": self.checked
        }

