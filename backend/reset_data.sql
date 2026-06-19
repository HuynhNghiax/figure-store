-- ============================================================
--  FIGURE STORE - TẠO BẢNG + RESET & SEED DATA
--  Database: figure_store (PostgreSQL)
--  Ngày tạo: 2026-06-18
--  Chạy độc lập - KHÔNG cần khởi động Spring Boot trước
--  CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu cũ!
-- ============================================================


-- ============================================================
-- BƯỚC 1: TẠO BẢNG (IF NOT EXISTS - an toàn nếu đã có)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(50),
    otp         VARCHAR(255),
    otp_expiry  TIMESTAMP,
    google_id   VARCHAR(255),
    enabled     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS products (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    price         DOUBLE PRECISION NOT NULL,
    brand         VARCHAR(255) NOT NULL,
    image_url     VARCHAR(255) NOT NULL,
    images        TEXT,
    description   TEXT,
    stock         INTEGER NOT NULL DEFAULT 0,
    is_pre_order  BOOLEAN DEFAULT FALSE,
    category_id   BIGINT,
    deleted       BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    customer_name   VARCHAR(255),
    phone           VARCHAR(50),
    address         TEXT,
    total_amount    DOUBLE PRECISION,
    status          VARCHAR(50)  DEFAULT 'PENDING',
    payment_status  VARCHAR(50)  DEFAULT 'UNPAID',
    payment_method  VARCHAR(50)  DEFAULT 'COD',
    paypal_order_id VARCHAR(255),
    coupon_code     VARCHAR(255),
    created_at      TIMESTAMP    DEFAULT NOW(),
    user_id         BIGINT
);

CREATE TABLE IF NOT EXISTS order_items (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT,
    product_id    BIGINT,
    product_name  VARCHAR(255),
    quantity      INTEGER,
    price         DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    product_id  BIGINT NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    product_id  BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id          BIGSERIAL PRIMARY KEY,
    product_id  BIGINT,
    user_id     BIGINT,
    username    VARCHAR(255),
    comment     TEXT,
    rating      INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reset_tokens (
    id           BIGSERIAL PRIMARY KEY,
    token        VARCHAR(255) NOT NULL UNIQUE,
    user_id      BIGINT NOT NULL,
    expiry_date  TIMESTAMP NOT NULL,
    used         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS coupons (
    id               BIGSERIAL PRIMARY KEY,
    code             VARCHAR(255) NOT NULL UNIQUE,
    discount_percent DOUBLE PRECISION NOT NULL,
    expiry_date      TIMESTAMP NOT NULL,
    max_uses         INTEGER NOT NULL,
    used_count       INTEGER NOT NULL DEFAULT 0
);


-- ============================================================
-- BƯỚC 2: XÓA DỮ LIỆU CŨ (TRUNCATE an toàn)
-- ============================================================

TRUNCATE TABLE reviews        RESTART IDENTITY CASCADE;
TRUNCATE TABLE order_items    RESTART IDENTITY CASCADE;
TRUNCATE TABLE orders         RESTART IDENTITY CASCADE;
TRUNCATE TABLE cart_items     RESTART IDENTITY CASCADE;
TRUNCATE TABLE wishlist_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE reset_tokens   RESTART IDENTITY CASCADE;
TRUNCATE TABLE coupons        RESTART IDENTITY CASCADE;
TRUNCATE TABLE products       RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories     RESTART IDENTITY CASCADE;
TRUNCATE TABLE users          RESTART IDENTITY CASCADE;


-- ============================================================
-- BƯỚC 3: CATEGORIES
-- ============================================================

INSERT INTO categories (id, name) VALUES
(1, 'Anime & Manga'),
(2, 'Game'),
(3, 'Marvel & DC'),
(4, 'Disney & Pixar'),
(5, 'Gundam & Mecha');

SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));


-- ============================================================
-- BƯỚC 4: USERS
-- Dùng pgcrypto để tạo hash BCrypt ngay trong DB → đảm bảo 100% đúng
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (username, password, email, role, enabled) VALUES
('admin', crypt('admin123', gen_salt('bf')), 'admin@figurestore.vn', 'ADMIN', true),
('user1', crypt('user123',  gen_salt('bf')), 'user1@figurestore.vn', 'USER',  true);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));




-- ============================================================
-- BƯỚC 5: PRODUCTS (29 sản phẩm)
-- ============================================================

INSERT INTO products (id, name, price, brand, image_url, images, description, stock, is_pre_order, category_id, deleted) VALUES

-- ── ANIME & MANGA (category_id = 1) — 6 sản phẩm ──────────
(1,  'Naruto Uzumaki - Sage Mode',
     450000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbtq7n30',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbtq7n30',
     'Mô hình Naruto Uzumaki trong trạng thái Sage Mode, chi tiết sắc nét, chất liệu PVC cao cấp. Chiều cao khoảng 18cm.',
     50, false, 1, false),

(2,  'Sasuke Uchiha - Rinnegan',
     480000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbsbhu58',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbsbhu58',
     'Mô hình Sasuke Uchiha kích hoạt Rinnegan, trang phục hậu chiến. Chất liệu PVC cao cấp. Chiều cao khoảng 17cm.',
     40, false, 1, false),

(3,  'Son Goku - Super Saiyan Blue',
     520000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbzchf1b',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbzchf1b',
     'Mô hình Son Goku biến đổi Super Saiyan Blue, tư thế chiến đấu đầy uy lực. Chất liệu PVC, có đế trưng bày. Chiều cao ~20cm.',
     35, false, 1, false),

(4,  'Vegeta - Super Saiyan',
     495000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc3k1eab',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc3k1eab',
     'Mô hình Vegeta biến đổi Super Saiyan với ánh mắt kiêu hãnh đặc trưng. Chất liệu PVC cao cấp, màu sắc sống động. Chiều cao ~19cm.',
     30, false, 1, false),

(5,  'Monkey D. Luffy - Gear 5 Sun God Nika',
     650000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53wstv2d',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53wstv2d',
     'Mô hình Luffy Gear 5 - Sun God Nika, biểu cảm vui vẻ đặc trưng. Phiên bản giới hạn, chất liệu PVC. Chiều cao ~22cm.',
     25, false, 1, false),

(6,  'Roronoa Zoro - Three Sword Style',
     580000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0fa5dq3iuq13',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0fa5dq3iuq13',
     'Mô hình Roronoa Zoro với thế kiếm Three Sword Style, băng bịt mắt và tư thế uy nghi. Chất liệu PVC, chiều cao ~20cm.',
     30, false, 1, false),

(7,  'Tanjiro Kamado - Water Breathing',
     420000, 'Aniplex',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53zlyrce',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53zlyrce',
     'Mô hình Tanjiro Kamado sử dụng Thủy Tức Kiếm Pháp, chi tiết vảy nước đẹp mắt. Chất liệu PVC cao cấp. Chiều cao ~17cm.',
     45, false, 1, false),

(8,  'Nezuko Kamado - Demon Form',
     390000, 'Aniplex',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix5410j719',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix5410j719',
     'Mô hình Nezuko Kamado trong dạng quỷ, hoa văn đặc trưng rực rỡ. Chất liệu PVC, kết hợp màu hồng và đen tinh tế. Chiều cao ~15cm.',
     50, false, 1, false),

(9,  'Eren Yeager - Attack Titan',
     700000, 'Good Smile',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53y7eb3f',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53y7eb3f',
     'Mô hình Eren Yeager dạng Attack Titan khổng lồ uy nghi. Chi tiết cơ bắp và xương điêu khắc tỉ mỉ. Chiều cao ~25cm.',
     20, false, 1, false),

(10, 'Levi Ackerman - Survey Corps Captain',
     550000, 'Good Smile',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vsqnnb1',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vsqnnb1',
     'Mô hình Đội trưởng Levi Ackerman trong đồng phục Binh đoàn Khảo sát, tư thế sẵn sàng chiến đấu. Chất liệu PVC. Chiều cao ~18cm.',
     35, false, 1, false),

(11, 'Gojo Satoru - Infinity',
     620000, 'Max Factory',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vvjsjd4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vvjsjd4',
     'Mô hình Gojo Satoru kích hoạt kỹ năng Vô Cực, mắt xanh lam đặc trưng. Hiệu ứng năng lượng tím bao quanh. Chiều cao ~20cm.',
     28, false, 1, false),

(12, 'Ryomen Sukuna - King of Curses',
     680000, 'Max Factory',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vu583e7',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vu583e7',
     'Mô hình Ryomen Sukuna - Vua của Chú thuật, với bốn mắt và hoa văn đặc trưng. Chất liệu PVC cao cấp. Chiều cao ~22cm.',
     22, false, 2, false),

-- ── GAME (category_id = 2) — 6 sản phẩm ───────────────────
(13, 'Cloud Strife - Final Fantasy VII Remake',
     890000, 'Square Enix',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3e0hfd3',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3e0hfd3',
     'Mô hình Cloud Strife từ Final Fantasy VII Remake, kèm kiếm Buster Sword huyền thoại. Chất liệu PVC và ABS. Chiều cao ~25cm.',
     15, false, 2, false),

(14, 'Link - The Legend of Zelda: Breath of the Wild',
     750000, 'Good Smile',
     'https://cf.shopee.vn/file/d32cfcf3ff89e878dce8c967802cb32a',
     'https://cf.shopee.vn/file/d32cfcf3ff89e878dce8c967802cb32a',
     'Mô hình Link từ Breath of the Wild, trang bị đầy đủ Paraglider. Chất liệu PVC cao cấp. Chiều cao ~20cm.',
     18, false, 2, false),

(15, 'Master Chief - Halo Infinite',
     980000, 'McFarlane',
     'https://cf.shopee.vn/file/6bae809a4ab997892e844c72657473b6',
     'https://cf.shopee.vn/file/6bae809a4ab997892e844c72657473b6',
     'Mô hình Master Chief từ Halo Infinite, bộ giáp Mjolnir chi tiết. Chất liệu PVC và ABS. Chiều cao ~23cm, kèm súng BR75.',
     12, false, 2, false),

(16, 'Geralt of Rivia - The Witcher 3',
     1200000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe4y38z99',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe4y38z99',
     'Mô hình Geralt of Rivia từ The Witcher 3, kèm kiếm bạc và huy hiệu Witcher. Chất liệu PVC cao cấp. Chiều cao ~27cm.',
     10, false, 2, false),

(17, '2B - NieR: Automata',
     1350000, 'Square Enix',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe57x2qe2',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe57x2qe2',
     'Mô hình 2B từ NieR: Automata, phong cách Gothic thanh lịch đặc trưng. Chất liệu PVC, tóc trắng, băng bịt mắt. Chiều cao ~24cm.',
     15, false, 2, false),

(18, 'Kratos - God of War Ragnarök',
     1100000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'Mô hình Kratos từ God of War Ragnarök, kèm Leviathan Axe và khiên Spartan. Chi tiết cơ bắp và sẹo ấn tượng. Chiều cao ~28cm.',
     12, false, 2, false),

-- ── MARVEL & DC (category_id = 3) — 6 sản phẩm ────────────
(19, 'Atreus - God of War Ragnarök',
     750000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'Mô hình Atreus - con trai của Kratos, kèm cung tên và trang phục Norse. Chất liệu PVC. Chiều cao ~18cm.',
     18, false, 3, false),

(20, 'Iron Man - Mark 85 (Avengers: Endgame)',
     850000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'Mô hình Iron Man bộ giáp Mark 85 từ Avengers: Endgame. Chi tiết nanosuit tỉ mỉ, hiệu ứng đèn LED trên ngực. Chiều cao ~30cm.',
     20, false, 3, false),

(21, 'Spider-Man - Integrated Suit (No Way Home)',
     720000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7ml2b75d',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7ml2b75d',
     'Mô hình Spider-Man Integrated Suit từ No Way Home, tư thế leo tường năng động. Chất liệu PVC cao cấp. Chiều cao ~22cm.',
     25, false, 3, false),

(22, 'Batman - The Dark Knight',
     800000, 'DC Collectibles',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7mi96bcd',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7mi96bcd',
     'Mô hình Batman phong cách Dark Knight uy nghiêm, áo choàng đen dài. Chất liệu PVC cao cấp. Chiều cao ~25cm.',
     22, false, 3, false),

(23, 'Thanos - Infinity Gauntlet',
     1500000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc96gj8f',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc96gj8f',
     'Mô hình Thanos cầm Găng tay Vô cực đầy đủ 6 viên đá. Chi tiết điêu khắc đỉnh cao, áo giáp titan uy nghiêm. Chiều cao ~35cm.',
     8, false, 3, false),

-- ── DISNEY & PIXAR (category_id = 4) — 6 sản phẩm ─────────
(24, 'Elsa - Frozen II',
     380000, 'Disney',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'Mô hình Elsa từ Frozen II, váy băng xanh lấp lánh, tóc tết đặc trưng. Chất liệu PVC. Chiều cao ~18cm.',
     60, false, 4, false),

(25, 'Buzz Lightyear - Toy Story',
     420000, 'Mattel',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'Mô hình Buzz Lightyear từ Toy Story, trang phục phi hành gia Space Ranger. Nút bấm phát âm thanh đặc trưng. Chiều cao ~20cm.',
     45, false, 4, false),

(26, 'Jack Sparrow - Pirates of the Caribbean',
     690000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc25gya2',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc25gya2',
     'Mô hình thuyền trưởng Jack Sparrow huyền thoại, kèm kiếm và la bàn huyền bí. Chất liệu PVC cao cấp. Chiều cao ~22cm.',
     18, false, 4, false),

-- ── GUNDAM & MECHA (category_id = 5) — 5 sản phẩm ─────────
(27, 'RX-78-2 Gundam - HG 1/144',
     350000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'Mô hình lắp ráp HG 1/144 RX-78-2 Gundam huyền thoại. Bộ nhựa màu chính xác, không cần sơn. Kèm Beam Rifle và Shield.',
     40, false, 5, false),

(28, 'Wing Gundam Zero - MG 1/100',
     950000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'Mô hình lắp ráp MG 1/100 Wing Gundam Zero EW phiên bản Endless Waltz. Cánh thiên thần uy nghi. Chi tiết tuyệt vời.',
     15, false, 5, false),

(29, 'Strike Freedom Gundam - PG 1/60',
     2800000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'Mô hình lắp ráp Perfect Grade 1/60 Strike Freedom Gundam, bộ mạ vàng cao cấp. Cánh DRAGOON mở ra hoành tráng. Đỉnh cao cho người chơi chuyên nghiệp.',
     5, true, 5, false);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));


-- ============================================================
-- BƯỚC 6: KIỂM TRA KẾT QUẢ
-- ============================================================

SELECT 'CATEGORIES' AS bang, COUNT(*) AS so_luong FROM categories
UNION ALL
SELECT 'USERS',     COUNT(*) FROM users
UNION ALL
SELECT 'PRODUCTS',  COUNT(*) FROM products;
