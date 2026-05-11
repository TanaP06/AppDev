from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy import func

from app.extensions import db
from app.models.user import User
from app.models.listing import Listing
from app.models.rating import Rating
from app.schemas import UserUpdateSchema
from app.utils.uploads import allowed_file, save_image

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

_update_schema = UserUpdateSchema()


def _user_stats(user_id):
    agg = db.session.query(
        func.avg(Rating.score).label("avg"),
        func.count(Rating.id).label("cnt"),
    ).filter(Rating.seller_id == user_id).one()
    active = Listing.query.filter_by(seller_id=user_id, is_sold=False).count()
    sold = Listing.query.filter_by(seller_id=user_id, is_sold=True).count()
    return {
        "avg_rating": round(float(agg.avg), 2) if agg.avg else None,
        "rating_count": agg.cnt,
        "active_listings_count": active,
        "sold_listings_count": sold,
    }


@users_bp.get("/me")
@jwt_required()
def get_me():
    user = User.query.get_or_404(int(get_jwt_identity()))
    return jsonify({**user.to_dict(), **_user_stats(user.id)}), 200


@users_bp.patch("/me")
@jwt_required()
def update_me():
    user = User.query.get_or_404(int(get_jwt_identity()))

    data = request.form.to_dict() or {}
    try:
        validated = _update_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    if "name" in validated:
        user.name = validated["name"]

    pic = request.files.get("profile_pic")
    if pic and allowed_file(pic.filename):
        user.profile_pic = save_image(pic)

    db.session.commit()
    return jsonify(user.to_dict()), 200


@users_bp.get("/<int:user_id>")
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    stats = _user_stats(user_id)

    active_listings = Listing.query.filter_by(seller_id=user_id, is_sold=False).order_by(Listing.created_at.desc()).all()
    sold_listings = Listing.query.filter_by(seller_id=user_id, is_sold=True).order_by(Listing.created_at.desc()).all()
    ratings = Rating.query.filter_by(seller_id=user_id).order_by(Rating.created_at.desc()).all()

    return jsonify({
        **user.to_dict(),
        **stats,
        "active_listings": [l.to_dict() for l in active_listings],
        "sold_listings": [l.to_dict() for l in sold_listings],
        "ratings": [r.to_dict() for r in ratings],
    }), 200


@users_bp.get("/<int:user_id>/ratings")
def get_user_ratings(user_id):
    User.query.get_or_404(user_id)
    agg = db.session.query(
        func.avg(Rating.score).label("avg"),
        func.count(Rating.id).label("cnt"),
    ).filter(Rating.seller_id == user_id).one()
    ratings = Rating.query.filter_by(seller_id=user_id).order_by(Rating.created_at.desc()).all()
    return jsonify({
        "avg_rating": round(float(agg.avg), 2) if agg.avg else None,
        "rating_count": agg.cnt,
        "ratings": [r.to_dict() for r in ratings],
    }), 200
