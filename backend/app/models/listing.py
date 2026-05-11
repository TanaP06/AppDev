from app.extensions import db
from datetime import datetime


class Listing(db.Model):
    __tablename__ = "listings"

    id = db.Column(db.Integer, primary_key=True)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.Enum("books", "electronics", "furniture", "other"), nullable=False)
    item_condition = db.Column(db.Enum("new", "like_new", "used"), nullable=False)
    is_sold = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    seller = db.relationship("User", foreign_keys=[seller_id], back_populates="listings")
    images = db.relationship("ListingImage", back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.sort_order")
    messages = db.relationship("Message", back_populates="listing", cascade="all, delete-orphan")
    ratings = db.relationship("Rating", back_populates="listing", cascade="all, delete-orphan")

    def to_dict(self, include_seller=True):
        data = {
            "id": self.id,
            "seller_id": self.seller_id,
            "title": self.title,
            "description": self.description,
            "price": float(self.price),
            "category": self.category,
            "item_condition": self.item_condition,
            "is_sold": self.is_sold,
            "created_at": self.created_at.isoformat(),
            "images": [img.url for img in self.images],
        }
        if include_seller and self.seller:
            from sqlalchemy import func
            from app.models.rating import Rating
            from app.extensions import db as _db
            agg = _db.session.query(
                func.avg(Rating.score).label("avg"),
                func.count(Rating.id).label("cnt"),
            ).filter(Rating.seller_id == self.seller_id).one()
            data["seller"] = {
                "id": self.seller.id,
                "name": self.seller.name,
                "profile_pic": self.seller.profile_pic,
                "avg_rating": round(float(agg.avg), 2) if agg.avg else None,
                "rating_count": agg.cnt,
            }
        return data


class ListingImage(db.Model):
    __tablename__ = "listing_images"

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    sort_order = db.Column(db.Integer, nullable=False, default=0)

    listing = db.relationship("Listing", back_populates="images")
