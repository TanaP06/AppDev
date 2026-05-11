from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy import func, or_

from app.extensions import db
from app.models.listing import Listing, ListingImage
from app.models.rating import Rating
from app.schemas import ListingCreateSchema, ListingUpdateSchema
from app.utils.uploads import allowed_file, save_image, delete_image

listings_bp = Blueprint("listings", __name__, url_prefix="/api/listings")

_create_schema = ListingCreateSchema()
_update_schema = ListingUpdateSchema()


def _seller_summary(seller):
    agg = db.session.query(
        func.avg(Rating.score).label("avg"),
        func.count(Rating.id).label("cnt"),
    ).filter(Rating.seller_id == seller.id).one()
    return {
        "id": seller.id,
        "name": seller.name,
        "profile_pic": seller.profile_pic,
        "avg_rating": round(float(agg.avg), 2) if agg.avg else None,
        "rating_count": agg.cnt,
    }


def _listing_dict(listing):
    d = listing.to_dict(include_seller=False)
    d["seller"] = _seller_summary(listing.seller)
    return d


@listings_bp.get("")
def get_listings():
    q = Listing.query
    include_sold = request.args.get("include_sold", "false").lower() == "true"
    if not include_sold:
        q = q.filter(Listing.is_sold == False)

    category = request.args.get("category")
    if category:
        q = q.filter(Listing.category == category)

    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if min_price is not None:
        q = q.filter(Listing.price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.price <= max_price)

    condition = request.args.get("item_condition")
    if condition:
        q = q.filter(Listing.item_condition == condition)

    keyword = request.args.get("q")
    if keyword:
        like = f"%{keyword}%"
        q = q.filter(or_(Listing.title.ilike(like), Listing.description.ilike(like)))

    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        q = q.order_by(Listing.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Listing.price.desc())
    else:
        q = q.order_by(Listing.created_at.desc())

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)
    pagination = q.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [_listing_dict(l) for l in pagination.items],
        "page": page,
        "per_page": per_page,
        "total": pagination.total,
    }), 200


@listings_bp.get("/<int:listing_id>")
def get_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    return jsonify(_listing_dict(listing)), 200


@listings_bp.post("")
@jwt_required()
def create_listing():
    form = request.form.to_dict()
    try:
        validated = _create_schema.load(form)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    files = request.files.getlist("images[]")
    valid_files = [f for f in files if f and allowed_file(f.filename)]
    if not valid_files:
        return jsonify({"error": "At least one image is required."}), 400
    if len(valid_files) > 6:
        return jsonify({"error": "Maximum 6 images allowed."}), 400

    seller_id = int(get_jwt_identity())
    listing = Listing(seller_id=seller_id, **validated)
    db.session.add(listing)
    db.session.flush()

    for i, f in enumerate(valid_files):
        url = save_image(f)
        db.session.add(ListingImage(listing_id=listing.id, url=url, sort_order=i))

    db.session.commit()
    return jsonify(_listing_dict(listing)), 201


@listings_bp.put("/<int:listing_id>")
@jwt_required()
def update_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    if listing.seller_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden."}), 403

    form = request.form.to_dict()
    try:
        validated = _update_schema.load(form)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    remove_ids = validated.pop("remove_image_ids", [])
    for key, val in validated.items():
        setattr(listing, key, val)

    if remove_ids:
        images_to_remove = ListingImage.query.filter(
            ListingImage.id.in_(remove_ids),
            ListingImage.listing_id == listing_id,
        ).all()
        for img in images_to_remove:
            delete_image(img.url)
            db.session.delete(img)

    new_files = request.files.getlist("images[]")
    valid_new = [f for f in new_files if f and allowed_file(f.filename)]
    existing_count = ListingImage.query.filter_by(listing_id=listing_id).count()
    if existing_count + len(valid_new) > 6:
        return jsonify({"error": "Maximum 6 images allowed."}), 400

    next_order = existing_count
    for i, f in enumerate(valid_new):
        url = save_image(f)
        db.session.add(ListingImage(listing_id=listing.id, url=url, sort_order=next_order + i))

    db.session.commit()
    return jsonify(_listing_dict(listing)), 200


@listings_bp.delete("/<int:listing_id>")
@jwt_required()
def delete_listing(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    if listing.seller_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden."}), 403

    for img in listing.images:
        delete_image(img.url)

    db.session.delete(listing)
    db.session.commit()
    return jsonify({"message": "Deleted."}), 200


@listings_bp.patch("/<int:listing_id>/sold")
@jwt_required()
def mark_sold(listing_id):
    listing = Listing.query.get_or_404(listing_id)
    if listing.seller_id != int(get_jwt_identity()):
        return jsonify({"error": "Forbidden."}), 403

    listing.is_sold = True
    db.session.commit()
    return jsonify(_listing_dict(listing)), 200
