from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.rating import Rating
from app.models.listing import Listing
from app.models.user import User
from app.schemas import RatingCreateSchema

ratings_bp = Blueprint("ratings", __name__, url_prefix="/api/ratings")

_create_schema = RatingCreateSchema()


@ratings_bp.get("/my")
@jwt_required()
def get_my_rating():
    me = int(get_jwt_identity())
    listing_id = request.args.get("listing_id", type=int)
    if not listing_id:
        return jsonify({"error": "listing_id query param required"}), 400
    rating = Rating.query.filter_by(reviewer_id=me, listing_id=listing_id).first()
    return jsonify(rating.to_dict() if rating else None), 200


@ratings_bp.post("")
@jwt_required()
def create_rating():
    data = request.get_json(silent=True) or {}
    try:
        validated = _create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    me = int(get_jwt_identity())
    listing = Listing.query.get_or_404(validated["listing_id"])

    if listing.seller_id == me:
        return jsonify({"error": "Cannot rate your own listing."}), 400
    if not listing.is_sold:
        return jsonify({"error": "Listing must be marked as sold before rating."}), 400

    rating = Rating(
        reviewer_id=me,
        seller_id=listing.seller_id,
        listing_id=listing.id,
        score=validated["score"],
        review_text=validated.get("review_text"),
    )
    db.session.add(rating)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "You have already rated this listing."}), 409

    return jsonify(rating.to_dict()), 201
