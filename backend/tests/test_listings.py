import io


def _register_and_login(client, email, name="User"):
    client.post("/api/auth/register", json={"name": name, "email": email, "password": "password123"})
    r = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    return r.get_json()["token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _fake_image():
    return (io.BytesIO(b"fake image data"), "test.jpg")


def test_create_and_get_listing(client):
    token = _register_and_login(client, "alice@student.chula.ac.th", "Alice")
    data = {
        "title": "Intro to CS Book",
        "description": "Good condition",
        "price": "150.00",
        "category": "books",
        "item_condition": "used",
    }
    r = client.post(
        "/api/listings",
        data={**data, "images[]": _fake_image()},
        headers=_auth(token),
        content_type="multipart/form-data",
    )
    assert r.status_code == 201
    listing_id = r.get_json()["id"]

    r2 = client.get(f"/api/listings/{listing_id}")
    assert r2.status_code == 200
    assert r2.get_json()["title"] == "Intro to CS Book"


def test_listing_requires_auth(client):
    r = client.post("/api/listings", data={"title": "x"}, content_type="multipart/form-data")
    assert r.status_code == 401


def test_delete_other_user_listing_forbidden(client):
    token_a = _register_and_login(client, "alice@student.chula.ac.th", "Alice")
    token_b = _register_and_login(client, "bob@student.chula.ac.th", "Bob")

    r = client.post(
        "/api/listings",
        data={"title": "Book", "price": "100", "category": "books", "item_condition": "used", "images[]": _fake_image()},
        headers=_auth(token_a),
        content_type="multipart/form-data",
    )
    listing_id = r.get_json()["id"]

    r2 = client.delete(f"/api/listings/{listing_id}", headers=_auth(token_b))
    assert r2.status_code == 403


def test_filter_by_category(client):
    token = _register_and_login(client, "alice@student.chula.ac.th")
    for cat in ["books", "electronics"]:
        client.post(
            "/api/listings",
            data={"title": f"{cat} item", "price": "100", "category": cat, "item_condition": "used", "images[]": _fake_image()},
            headers=_auth(token),
            content_type="multipart/form-data",
        )
    r = client.get("/api/listings?category=books")
    items = r.get_json()["items"]
    assert all(i["category"] == "books" for i in items)
