from flask_jwt_extended import get_jwt_identity
from app.models.user import User


def current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)
