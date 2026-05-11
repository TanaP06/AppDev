from app.extensions import db
from datetime import datetime


class Rating(db.Model):
    __tablename__ = "ratings"

    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    score = db.Column(db.SmallInteger, nullable=False)
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("reviewer_id", "listing_id", name="uq_review"),
        db.CheckConstraint("score BETWEEN 1 AND 5", name="ck_score"),
    )

    reviewer = db.relationship("User", foreign_keys=[reviewer_id], back_populates="given_ratings")
    seller = db.relationship("User", foreign_keys=[seller_id], back_populates="received_ratings")
    listing = db.relationship("Listing", back_populates="ratings")

    def to_dict(self):
        return {
            "id": self.id,
            "reviewer_id": self.reviewer_id,
            "reviewer_name": self.reviewer.name if self.reviewer else None,
            "seller_id": self.seller_id,
            "listing_id": self.listing_id,
            "score": self.score,
            "review_text": self.review_text,
            "created_at": self.created_at.isoformat(),
        }
