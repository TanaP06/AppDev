# SecondHand Marketplace — Chulalongkorn University

A campus-based marketplace where Chulalongkorn University students can buy and sell items.

**Team:** Tanapat Chantawarang, Worranai Nagasawa, Htet Swan Yee

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node 20+
- MySQL 8.x (running on port 3306)

---

### 1. Install MySQL

**Windows:**
1. Download **MySQL Installer** from https://dev.mysql.com/downloads/installer/
2. Run the installer and choose **"Developer Default"** (installs MySQL Server + Workbench).
3. During setup, set a **root password** — write it down, you'll need it.
4. Leave the port as **3306** (default).
5. Finish the installer. MySQL should now be running as a Windows service.

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation   # follow the prompts to set a root password
```

To verify MySQL is running, open a terminal and type:
```bash
mysql -u root -p
```
Enter your root password. If you see the `mysql>` prompt, MySQL is working. Type `exit` to leave.

---

### 2. Database Setup

Open a terminal (or the MySQL command-line client) and log in as root:
```bash
mysql -u root -p
```

Then paste and run these commands one by one (or all at once):

```sql
CREATE DATABASE IF NOT EXISTS secondhand CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'shuser'@'localhost' IDENTIFIED BY 'shpassword';
GRANT ALL PRIVILEGES ON secondhand.* TO 'shuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> **What this does:**
> - Creates a database called `secondhand`
> - Creates a MySQL user `shuser` with password `shpassword` that the app will use
> - Gives that user full access to the `secondhand` database

Now apply the schema (creates all the tables). Run this in your terminal **from the project root folder**:

**Windows:**
```bash
mysql -u shuser -pshpassword secondhand < backend\migrations\001_initial.sql
```

**macOS:**
```bash
mysql -u shuser -pshpassword secondhand < backend/migrations/001_initial.sql
```

If you see no output and no errors, the database is ready.

### 3. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Copy the example env file and set your secret key:

```bash
# Windows:
copy .env.example .env
# macOS:
cp .env.example .env
```

Then generate a secret key and paste it into `backend/.env`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Open `backend/.env` and replace `change-this-to-a-long-random-string` with the output above.

```bash
python run.py
```

Backend runs at **http://localhost:5001**

### 4. Frontend

```bash
cd frontend
# Windows:
copy .env.example .env
# macOS:
cp .env.example .env

npm install --legacy-peer-deps
npx expo start --web   # opens in browser
```

---

## Environment Variables

### `backend/.env`
| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string — `mysql+pymysql://shuser:shpassword@localhost:3306/secondhand` |
| `JWT_SECRET_KEY` | Secret used to sign JWTs — change before deploying |
| `UPLOAD_FOLDER` | Folder for uploaded images (default: `uploads`) |

### `frontend/.env`
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the backend API — `http://localhost:5001` |

---

## API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | – | Register (Chula emails only) |
| POST | `/api/auth/login` | – | Login, returns JWT |
| GET | `/api/listings` | – | List / search / filter listings |
| GET | `/api/listings/:id` | – | Single listing detail |
| POST | `/api/listings` | ✓ | Create listing (multipart) |
| PUT | `/api/listings/:id` | ✓ (seller) | Update listing |
| DELETE | `/api/listings/:id` | ✓ (seller) | Delete listing |
| PATCH | `/api/listings/:id/sold` | ✓ (seller) | Mark as sold |
| GET | `/api/messages/threads` | ✓ | All chat threads for current user |
| GET | `/api/messages/:listing_id` | ✓ | Thread for a listing |
| POST | `/api/messages` | ✓ | Send message |
| POST | `/api/ratings` | ✓ | Rate a seller |
| GET | `/api/users/me` | ✓ | Current user profile |
| PATCH | `/api/users/me` | ✓ | Update name / profile pic |
| GET | `/api/users/:id` | – | Public profile + listings + ratings |
| GET | `/api/users/:id/ratings` | – | Ratings for a user |

---

## Known Limitations

Per project scope:
- **No online payment** — transactions happen in person
- **No delivery** — pickup only
- **No AI/ML recommendations** — browse and search only
- **No real-time messaging** — chat polls every 5 seconds
- **Email verification is implicit** — Chula domain = verified automatically
