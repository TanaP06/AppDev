import os
from flask import Flask, send_from_directory
from app.config import Config
from app.extensions import db, jwt, cors


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes.auth import auth_bp
    from app.routes.listings import listings_bp
    from app.routes.messages import messages_bp
    from app.routes.ratings import ratings_bp
    from app.routes.users import users_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(listings_bp)
    app.register_blueprint(messages_bp)
    app.register_blueprint(ratings_bp)
    app.register_blueprint(users_bp)

    upload_folder = app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(os.path.abspath(upload_folder), filename)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}, 200

    return app
