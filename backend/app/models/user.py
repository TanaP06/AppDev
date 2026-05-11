from app.extensions import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    profile_pic = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    listings = db.relationship("Listing", foreign_keys="Listing.seller_id", back_populates="seller", cascade="all, delete-orphan")
    sent_messages = db.relationship("Message", foreign_keys="Message.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = db.relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver", cascade="all, delete-orphan")
    given_ratings = db.relationship("Rating", foreign_keys="Rating.reviewer_id", back_populates="reviewer", cascade="all, delete-orphan")
    received_ratings = db.relationship("Rating", foreign_keys="Rating.seller_id", back_populates="seller", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "is_verified": self.is_verified,
            "profile_pic": self.profile_pic,
            "created_at": self.created_at.isoformat(),
        }
