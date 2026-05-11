def test_register_valid(client):
    r = client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@student.chula.ac.th",
        "password": "password123",
    })
    assert r.status_code == 201
    data = r.get_json()
    assert data["user"]["is_verified"] is True
    assert "token" in data


def test_register_invalid_domain(client):
    r = client.post("/api/auth/register", json={
        "name": "Eve",
        "email": "eve@gmail.com",
        "password": "password123",
    })
    assert r.status_code == 400


def test_register_duplicate(client):
    payload = {"name": "Alice", "email": "alice@student.chula.ac.th", "password": "password123"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 409


def test_login_success(client):
    client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@student.chula.ac.th",
        "password": "password123",
    })
    r = client.post("/api/auth/login", json={
        "email": "alice@student.chula.ac.th",
        "password": "password123",
    })
    assert r.status_code == 200
    assert "token" in r.get_json()


def test_login_bad_password(client):
    client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@student.chula.ac.th",
        "password": "password123",
    })
    r = client.post("/api/auth/login", json={
        "email": "alice@student.chula.ac.th",
        "password": "wrongpassword",
    })
    assert r.status_code == 401


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"
