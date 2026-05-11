import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.user import User
from app.schemas import RegisterSchema, LoginSchema

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

_register_schema = RegisterSchema()
_login_schema = LoginSchema()


@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    try:
        validated = _register_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    pw_hash = bcrypt.hashpw(validated["password"].encode(), bcrypt.gensalt()).decode()
    user = User(
        name=validated["name"],
        email=validated["email"].lower(),
        password_hash=pw_hash,
        is_verified=True,
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email already registered."}), 409

    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "token": token}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    try:
        validated = _login_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    user = User.query.filter_by(email=validated["email"].lower()).first()
    if not user or not bcrypt.checkpw(validated["password"].encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid credentials."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "token": token}), 200
