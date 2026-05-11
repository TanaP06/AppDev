CREATE DATABASE IF NOT EXISTS secondhand
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE secondhand;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
  profile_pic   VARCHAR(255)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  seller_id      INT NOT NULL,
  title          VARCHAR(200)   NOT NULL,
  description    TEXT           NULL,
  price          DECIMAL(10,2)  NOT NULL,
  category       ENUM('books','electronics','furniture','other') NOT NULL,
  item_condition ENUM('new','like_new','used') NOT NULL,
  is_sold        BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_category (category),
  INDEX idx_seller (seller_id),
  INDEX idx_created (created_at DESC)
);

CREATE TABLE IF NOT EXISTS listing_images (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  listing_id  INT NOT NULL,
  sender_id   INT NOT NULL,
  receiver_id INT NOT NULL,
  content     TEXT NOT NULL,
  sent_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id)  REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_thread (listing_id, sent_at)
);

CREATE TABLE IF NOT EXISTS ratings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  reviewer_id INT NOT NULL,
  seller_id   INT NOT NULL,
  listing_id  INT NOT NULL,
  score       TINYINT NOT NULL,
  review_text TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (score BETWEEN 1 AND 5),
  UNIQUE KEY uq_review (reviewer_id, listing_id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (seller_id)   REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id)  REFERENCES listings(id) ON DELETE CASCADE
);
