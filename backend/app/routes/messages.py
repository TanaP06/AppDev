from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy import or_, func

from app.extensions import db
from app.models.message import Message
from app.models.listing import Listing
from app.models.user import User
from app.schemas import MessageCreateSchema

messages_bp = Blueprint("messages", __name__, url_prefix="/api/messages")

_create_schema = MessageCreateSchema()


@messages_bp.get("/threads")
@jwt_required()
def get_threads():
    me = int(get_jwt_identity())
    my_messages = Message.query.filter(
        or_(Message.sender_id == me, Message.receiver_id == me)
    ).all()

    thread_map = {}
    for msg in my_messages:
        counterpart = msg.receiver_id if msg.sender_id == me else msg.sender_id
        key = (msg.listing_id, counterpart)
        if key not in thread_map or msg.sent_at > thread_map[key].sent_at:
            thread_map[key] = msg

    threads = []
    for (listing_id, counterpart_id), last_msg in thread_map.items():
        listing = Listing.query.get(listing_id)
        counterpart = User.query.get(counterpart_id)
        if not listing or not counterpart:
            continue
        threads.append({
            "listing_id": listing_id,
            "listing_title": listing.title,
            "listing_image": listing.images[0].url if listing.images else None,
            "counterpart": {"id": counterpart.id, "name": counterpart.name, "profile_pic": counterpart.profile_pic},
            "last_message": last_msg.content,
            "last_sent_at": last_msg.sent_at.isoformat(),
        })

    threads.sort(key=lambda t: t["last_sent_at"], reverse=True)
    return jsonify(threads), 200


@messages_bp.get("/<int:listing_id>")
@jwt_required()
def get_thread(listing_id):
    me = int(get_jwt_identity())
    Listing.query.get_or_404(listing_id)
    msgs = Message.query.filter(
        Message.listing_id == listing_id,
        or_(Message.sender_id == me, Message.receiver_id == me),
    ).order_by(Message.sent_at.asc()).all()
    return jsonify([m.to_dict() for m in msgs]), 200


@messages_bp.post("")
@jwt_required()
def send_message():
    data = request.get_json(silent=True) or {}
    try:
        validated = _create_schema.load(data)
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

    me = int(get_jwt_identity())
    if me == validated["receiver_id"]:
        return jsonify({"error": "Cannot message yourself."}), 400

    Listing.query.get_or_404(validated["listing_id"])

    msg = Message(
        listing_id=validated["listing_id"],
        sender_id=me,
        receiver_id=validated["receiver_id"],
        content=validated["content"],
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify(msg.to_dict()), 201
