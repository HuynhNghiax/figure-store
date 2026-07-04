-- ============================================================
--  FIGURE STORE (FigHub) — RESET & SEED DATA ĐẦY ĐỦ
--  Database : figure_store (PostgreSQL)
--  Chạy độc lập - KHÔNG cần Spring Boot đang chạy
--  CẢNH BÁO: Script sẽ XÓA TOÀN BỘ dữ liệu cũ!
-- ============================================================


-- ============================================================
-- BƯỚC 1: TẠO BẢNG (IF NOT EXISTS — an toàn nếu đã có)
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
    enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    full_name   VARCHAR(255),
    phone       VARCHAR(50),
    avatar_url  VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS products (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    price         DOUBLE PRECISION NOT NULL,
    brand         VARCHAR(255) NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
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
-- BƯỚC 3: CATEGORIES (5 danh mục)
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
-- Mật khẩu BCrypt (pgcrypto):
--   admin  → admin123
--   user1  → user123
--   user2  → user123
--   user3  → user123
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, username, password, email, role, enabled, full_name, phone) VALUES

-- ── Admin ─────────────────────────────────────────────────────
(1, 'admin',
    crypt('admin123', gen_salt('bf')),
    'admin@fighub.vn', 'ADMIN', true,
    'FigHub Admin', '0901234567'),

-- ── User1: có đơn hàng COMPLETED → được review ────────────────
(2, 'user1',
    crypt('user123', gen_salt('bf')),
    'user1@fighub.vn', 'USER', true,
    'Nguyễn Văn An', '0912345678'),

-- ── User2: có nhiều loại đơn hàng ─────────────────────────────
(3, 'user2',
    crypt('user123', gen_salt('bf')),
    'user2@fighub.vn', 'USER', true,
    'Trần Thị Bình', '0923456789'),

-- ── User3: chưa có đơn → KHÔNG được review ────────────────────
(4, 'user3',
    crypt('user123', gen_salt('bf')),
    'user3@fighub.vn', 'USER', true,
    'Lê Minh Cường', '0934567890'),

-- ── User chưa kích hoạt OTP (test flow đăng ký) ────────────────
(5, 'user_pending',
    crypt('user123', gen_salt('bf')),
    'pending@fighub.vn', 'USER', false,
    NULL, NULL);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));


-- ============================================================
-- BƯỚC 5: PRODUCTS (30 sản phẩm đa dạng)
-- ============================================================

INSERT INTO products (id, name, price, brand, image_url, images, description, stock, is_pre_order, category_id, deleted) VALUES

-- ── ANIME & MANGA (category_id = 1) ─────────────────────────
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

(4,  'Monkey D. Luffy - Gear 5 Sun God Nika',
     650000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53wstv2d',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53wstv2d',
     'Mô hình Luffy Gear 5 - Sun God Nika, biểu cảm vui vẻ đặc trưng. Phiên bản giới hạn, chất liệu PVC. Chiều cao ~22cm.',
     25, false, 1, false),

(5,  'Tanjiro Kamado - Water Breathing',
     420000, 'Aniplex',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53zlyrce',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53zlyrce',
     'Mô hình Tanjiro Kamado sử dụng Thủy Tức Kiếm Pháp, chi tiết vảy nước đẹp mắt. Chất liệu PVC cao cấp. Chiều cao ~17cm.',
     45, false, 1, false),

(6,  'Eren Yeager - Attack Titan',
     700000, 'Good Smile',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53y7eb3f',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0cix53y7eb3f',
     'Mô hình Eren Yeager dạng Attack Titan khổng lồ uy nghi. Chi tiết cơ bắp và xương điêu khắc tỉ mỉ. Chiều cao ~25cm.',
     20, false, 1, false),

(7,  'Gojo Satoru - Infinity',
     620000, 'Max Factory',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vvjsjd4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vvjsjd4',
     'Mô hình Gojo Satoru kích hoạt kỹ năng Vô Cực, mắt xanh lam đặc trưng. Hiệu ứng năng lượng tím bao quanh. Chiều cao ~20cm.',
     28, false, 1, false),

(8,  'Roronoa Zoro - Three Sword Style',
     580000, 'Banpresto',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0fa5dq3iuq13',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0fa5dq3iuq13',
     'Mô hình Roronoa Zoro với thế kiếm Three Sword Style, băng bịt mắt và tư thế uy nghi. Chất liệu PVC, chiều cao ~20cm.',
     30, false, 1, false),

-- ── GAME (category_id = 2) ───────────────────────────────────
(9,  'Cloud Strife - Final Fantasy VII Remake',
     890000, 'Square Enix',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3e0hfd3',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3e0hfd3',
     'Mô hình Cloud Strife từ Final Fantasy VII Remake, kèm kiếm Buster Sword huyền thoại. Chất liệu PVC và ABS. Chiều cao ~25cm.',
     15, false, 2, false),

(10, 'Link - The Legend of Zelda: Breath of the Wild',
     750000, 'Good Smile',
     'https://cf.shopee.vn/file/d32cfcf3ff89e878dce8c967802cb32a',
     'https://cf.shopee.vn/file/d32cfcf3ff89e878dce8c967802cb32a',
     'Mô hình Link từ Breath of the Wild, trang bị đầy đủ Paraglider. Chất liệu PVC cao cấp. Chiều cao ~20cm.',
     18, false, 2, false),

(11, 'Kratos - God of War Ragnarök',
     1100000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe5exwy21',
     'Mô hình Kratos từ God of War Ragnarök, kèm Leviathan Axe và khiên Spartan. Chi tiết cơ bắp và sẹo ấn tượng. Chiều cao ~28cm.',
     12, false, 2, false),

(12, 'Geralt of Rivia - The Witcher 3',
     1200000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe4y38z99',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe4y38z99',
     'Mô hình Geralt of Rivia từ The Witcher 3, kèm kiếm bạc và huy hiệu Witcher. Chất liệu PVC cao cấp. Chiều cao ~27cm.',
     10, false, 2, false),

(13, '2B - NieR: Automata',
     1350000, 'Square Enix',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe57x2qe2',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh4xnoe57x2qe2',
     'Mô hình 2B từ NieR: Automata, phong cách Gothic thanh lịch đặc trưng. Chất liệu PVC, tóc trắng, băng bịt mắt. Chiều cao ~24cm.',
     15, false, 2, false),

-- Sản phẩm hết hàng (test hiển thị hết hàng)
(14, 'Alucard - Castlevania (Hết hàng)',
     980000, 'NECA',
     'https://cf.shopee.vn/file/6bae809a4ab997892e844c72657473b6',
     'https://cf.shopee.vn/file/6bae809a4ab997892e844c72657473b6',
     'Mô hình Alucard từ Castlevania, áo choàng trắng sang trọng, kèm thanh kiếm Alucard. Chất liệu PVC. Chiều cao ~24cm.',
     0, false, 2, false),

-- ── MARVEL & DC (category_id = 3) ───────────────────────────
(15, 'Iron Man - Mark 85 (Avengers: Endgame)',
     850000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'Mô hình Iron Man bộ giáp Mark 85 từ Avengers: Endgame. Chi tiết nanosuit tỉ mỉ, hiệu ứng đèn LED trên ngực. Chiều cao ~30cm.',
     20, false, 3, false),

(16, 'Spider-Man - Integrated Suit (No Way Home)',
     720000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7ml2b75d',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7ml2b75d',
     'Mô hình Spider-Man Integrated Suit từ No Way Home, tư thế leo tường năng động. Chất liệu PVC cao cấp. Chiều cao ~22cm.',
     25, false, 3, false),

(17, 'Batman - The Dark Knight',
     800000, 'DC Collectibles',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7mi96bcd',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz4ej7mi96bcd',
     'Mô hình Batman phong cách Dark Knight uy nghiêm, áo choàng đen dài. Chất liệu PVC cao cấp. Chiều cao ~25cm.',
     22, false, 3, false),

(18, 'Thanos - Infinity Gauntlet',
     1500000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc96gj8f',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc96gj8f',
     'Mô hình Thanos cầm Găng tay Vô cực đầy đủ 6 viên đá. Chi tiết điêu khắc đỉnh cao, áo giáp titan uy nghiêm. Chiều cao ~35cm.',
     8, false, 3, false),

(19, 'Captain America - Endgame',
     780000, 'Hot Toys',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgz3boh3ff1v68',
     'Mô hình Captain America kèm khiên vibranium huyền thoại từ Avengers: Endgame. Chất liệu PVC cao cấp. Chiều cao ~28cm.',
     16, false, 3, false),

-- ── DISNEY & PIXAR (category_id = 4) ────────────────────────
(20, 'Elsa - Frozen II',
     380000, 'Disney',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'Mô hình Elsa từ Frozen II, váy băng xanh lấp lánh, tóc tết đặc trưng. Chất liệu PVC. Chiều cao ~18cm.',
     60, false, 4, false),

(21, 'Buzz Lightyear - Toy Story',
     420000, 'Mattel',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'Mô hình Buzz Lightyear từ Toy Story, trang phục phi hành gia Space Ranger. Nút bấm phát âm thanh đặc trưng. Chiều cao ~20cm.',
     45, false, 4, false),

(22, 'Jack Sparrow - Pirates of the Caribbean',
     690000, 'NECA',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc25gya2',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc25gya2',
     'Mô hình thuyền trưởng Jack Sparrow huyền thoại, kèm kiếm và la bàn huyền bí. Chất liệu PVC cao cấp. Chiều cao ~22cm.',
     18, false, 4, false),

-- Sản phẩm đã bị xóa mềm (test soft delete / admin restore)
(23, 'Moana - Disney (Đã xóa)',
     350000, 'Disney',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3ncu8z771',
     'Mô hình Moana với bộ trang phục Polynesia truyền thống, kèm vòng cổ xanh lam. Chiều cao ~17cm.',
     20, false, 4, true),

-- ── GUNDAM & MECHA (category_id = 5) ────────────────────────
(24, 'RX-78-2 Gundam - HG 1/144',
     350000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'Mô hình lắp ráp HG 1/144 RX-78-2 Gundam huyền thoại. Bộ nhựa màu chính xác, không cần sơn. Kèm Beam Rifle và Shield.',
     40, false, 5, false),

(25, 'Wing Gundam Zero - MG 1/100',
     950000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'Mô hình lắp ráp MG 1/100 Wing Gundam Zero EW phiên bản Endless Waltz. Cánh thiên thần uy nghi. Chi tiết tuyệt vời.',
     15, false, 5, false),

(26, 'Strike Freedom Gundam - PG 1/60',
     2800000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'Mô hình lắp ráp Perfect Grade 1/60 Strike Freedom Gundam, bộ mạ vàng cao cấp. Cánh DRAGOON mở ra hoành tráng. Đỉnh cao cho người chơi chuyên nghiệp.',
     5, true, 5, false),

(27, 'Evangelion Unit-01 - RG 1/144',
     780000, 'Bandai',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nc7rw347',
     'Mô hình lắp ráp RG 1/144 Evangelion Unit-01, màu tím-xanh đặc trưng. Có thể chuyển sang Berserk Mode. Chi tiết đặc biệt tinh xảo.',
     20, false, 5, false),

(28, 'Optimus Prime - Transformers',
     1800000, 'Hasbro',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgzyg3nbwj76e4',
     'Mô hình Optimus Prime có thể biến đổi thành xe tải. Cao cấp Masterpiece series, hợp kim + nhựa. Chiều cao robot ~32cm.',
     8, false, 5, false),

-- Pre-order item
(29, 'Guts - Berserk (Pre-order)',
     2200000, 'Good Smile',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vsqnnb1',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lgyy617vsqnnb1',
     'Mô hình Guts từ Berserk với Kiếm Phòng Thủ khổng lồ, trang phục Berserker Armor. Phiên bản giới hạn cao cấp. Chiều cao ~30cm.',
     0, true, 1, false),

-- Sản phẩm giá thấp để test filter giá
(30, 'Pikachu - Pokemon (Mini Figure)',
     85000, 'Takara Tomy',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'https://cf.shopee.vn/file/vn-11134207-7qukw-lh0b36xss9v7b3',
     'Mini figure Pikachu siêu dễ thương, chất liệu PVC an toàn. Phù hợp sưu tầm hoặc làm quà tặng. Chiều cao ~5cm.',
     100, false, 1, false);

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));


-- ============================================================
-- BƯỚC 6: COUPONS (4 mã giảm giá — đủ kịch bản test)
-- ============================================================

INSERT INTO coupons (code, discount_percent, expiry_date, max_uses, used_count) VALUES

-- Mã còn hiệu lực, còn lượt (test thành công)
('SALE10',  10.0, NOW() + INTERVAL '30 days', 100, 5),
('SALE20',  20.0, NOW() + INTERVAL '7 days',  50,  0),
('VIP50',   50.0, NOW() + INTERVAL '1 day',   10,  8),

-- Mã đã hết hạn (test thông báo lỗi)
('EXPIRED', 15.0, NOW() - INTERVAL '1 day',   50,  0),

-- Mã đã dùng hết lượt (test thông báo lỗi)
('USED100', 25.0, NOW() + INTERVAL '30 days', 10, 10);


-- ============================================================
-- BƯỚC 7: ORDERS (6 đơn hàng đủ trạng thái để test)
-- ============================================================

-- Đơn 1: user1 — COMPLETED, COD, PAID → user1 được review sp 1, 2
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (1, 'Nguyễn Văn An', '0912345678', '123 Lê Lợi, Q1, TP.HCM',
        930000, 'COMPLETED', 'PAID', 'COD', NULL,
        NOW() - INTERVAL '20 days', 2);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(1, 1, 'Naruto Uzumaki - Sage Mode',     1, 450000),
(1, 2, 'Sasuke Uchiha - Rinnegan',       1, 480000);

-- Đơn 2: user1 — COMPLETED, COD, PAID → user1 được review sp 3, 4
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (2, 'Nguyễn Văn An', '0912345678', '123 Lê Lợi, Q1, TP.HCM',
        1170000, 'COMPLETED', 'PAID', 'COD', 'SALE10',
        NOW() - INTERVAL '15 days', 2);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(2, 3, 'Son Goku - Super Saiyan Blue',          1, 520000),
(2, 4, 'Monkey D. Luffy - Gear 5 Sun God Nika', 1, 650000);

-- Đơn 3: user1 — PENDING (test hủy đơn)
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (3, 'Nguyễn Văn An', '0912345678', '123 Lê Lợi, Q1, TP.HCM',
        1600000, 'PENDING', 'PAID', 'COD', NULL,
        NOW() - INTERVAL '2 days', 2);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(3, 18, 'Thanos - Infinity Gauntlet', 1, 1500000),
(3, 30, 'Pikachu - Pokemon (Mini Figure)', 1, 85000);

-- Đơn 4: user2 — SHIPPED (đang giao)
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (4, 'Trần Thị Bình', '0923456789', '456 Trần Hưng Đạo, Q5, TP.HCM',
        1850000, 'SHIPPED', 'PAID', 'COD', 'SALE20',
        NOW() - INTERVAL '5 days', 3);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(4, 11, 'Kratos - God of War Ragnarök',   1, 1100000),
(4, 15, 'Iron Man - Mark 85 (Endgame)',    1, 850000);

-- Đơn 5: user2 — CANCELLED (đã hủy)
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (5, 'Trần Thị Bình', '0923456789', '456 Trần Hưng Đạo, Q5, TP.HCM',
        720000, 'CANCELLED', 'PAID', 'COD', NULL,
        NOW() - INTERVAL '10 days', 3);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(5, 16, 'Spider-Man - Integrated Suit', 1, 720000);

-- Đơn 6: khách vãng lai (user_id NULL) — COD, PENDING
INSERT INTO orders (id, customer_name, phone, address, total_amount, status, payment_status, payment_method, coupon_code, created_at, user_id)
VALUES (6, 'Phạm Quốc Dũng', '0945678901', '789 Đinh Tiên Hoàng, Q.BT, TP.HCM',
        1270000, 'PENDING', 'PAID', 'COD', NULL,
        NOW() - INTERVAL '1 day', NULL);

INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
(6, 24, 'RX-78-2 Gundam - HG 1/144',   2, 350000),
(6, 25, 'Wing Gundam Zero - MG 1/100',  1, 570000);

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
SELECT setval('order_items_id_seq', (SELECT MAX(id) FROM order_items));


-- ============================================================
-- BƯỚC 8: REVIEWS (user1 đã mua sp 1,2,3,4 → được review)
-- ============================================================

INSERT INTO reviews (product_id, user_id, username, comment, rating, created_at) VALUES

-- Sp 1: 3 review từ nhiều user (test avg rating)
(1, 2, 'user1',
 'Sản phẩm đúng như hình, chất lượng PVC rất tốt, màu sắc sắc nét. Đóng gói cẩn thận. Sẽ mua lại!',
 5, NOW() - INTERVAL '19 days'),

(2, 2, 'user1',
 'Mô hình Sasuke đẹp lắm, chi tiết Rinnegan cực kỳ sắc sảo. Giao hàng nhanh.',
 5, NOW() - INTERVAL '14 days'),

(3, 2, 'user1',
 'Goku SSB đỉnh! Đế trưng bày chắc chắn, tư thế chiến đấu rất đẹp.',
 4, NOW() - INTERVAL '14 days'),

(4, 2, 'user1',
 'Luffy Gear 5 siêu cute, biểu cảm rất vui. Nhưng giá hơi cao một xíu.',
 4, NOW() - INTERVAL '13 days');


-- ============================================================
-- BƯỚC 9: CART ITEMS (giỏ hàng mẫu cho user2 và user3)
-- ============================================================

INSERT INTO cart_items (user_id, product_id, quantity) VALUES
-- user2 đang có 2 sản phẩm trong giỏ
(3, 7,  1),   -- Gojo Satoru
(3, 27, 2),   -- Evangelion Unit-01 x2

-- user3 đang có 1 sản phẩm
(4, 30, 3);   -- Pikachu x3


-- ============================================================
-- BƯỚC 10: WISHLIST (danh sách yêu thích)
-- ============================================================

INSERT INTO wishlist_items (user_id, product_id) VALUES
-- user1 yêu thích
(2, 26),   -- Strike Freedom PG
(2, 29),   -- Guts Berserk Pre-order
(2, 18),   -- Thanos

-- user2 yêu thích
(3, 6),    -- Eren Yeager
(3, 13);   -- 2B NieR


-- ============================================================
-- BƯỚC 11: RESET TOKEN MẪU (test flow quên mật khẩu)
-- ============================================================

-- Token hợp lệ, chưa hết hạn (dùng để test reset password)
INSERT INTO reset_tokens (token, user_id, expiry_date, used) VALUES
('test-valid-token-abc123', 2, NOW() + INTERVAL '5 minutes', false),

-- Token đã hết hạn
('test-expired-token-xyz', 3, NOW() - INTERVAL '10 minutes', false),

-- Token đã dùng
('test-used-token-def456', 2, NOW() + INTERVAL '5 minutes', true);


-- ============================================================
-- BƯỚC 12: KIỂM TRA KẾT QUẢ
-- ============================================================

SELECT '== TỔNG KẾT SEED DATA ==' AS info;

SELECT
    'CATEGORIES'   AS bang, COUNT(*) AS so_luong FROM categories
UNION ALL SELECT 'USERS',        COUNT(*) FROM users
UNION ALL SELECT 'PRODUCTS',     COUNT(*) FROM products
UNION ALL SELECT 'PRODUCTS_DEL', COUNT(*) FROM products WHERE deleted = true
UNION ALL SELECT 'PRODUCTS_OOS', COUNT(*) FROM products WHERE stock = 0 AND deleted = false
UNION ALL SELECT 'ORDERS',       COUNT(*) FROM orders
UNION ALL SELECT 'ORDER_ITEMS',  COUNT(*) FROM order_items
UNION ALL SELECT 'REVIEWS',      COUNT(*) FROM reviews
UNION ALL SELECT 'COUPONS',      COUNT(*) FROM coupons
UNION ALL SELECT 'CART_ITEMS',   COUNT(*) FROM cart_items
UNION ALL SELECT 'WISHLIST',     COUNT(*) FROM wishlist_items
UNION ALL SELECT 'RESET_TOKENS', COUNT(*) FROM reset_tokens;


-- ============================================================
-- TÓM TẮT TÀI KHOẢN TEST
-- ============================================================
/*
  ┌──────────────┬──────────────┬───────┬────────────────────────────────────────────┐
  │ Username     │ Password     │ Role  │ Ghi chú                                    │
  ├──────────────┼──────────────┼───────┼────────────────────────────────────────────┤
  │ admin        │ admin123     │ ADMIN │ Quản trị đầy đủ                            │
  │ user1        │ user123      │ USER  │ Có 3 đơn (2 COMPLETED, 1 PENDING) + review │
  │ user2        │ user123      │ USER  │ Có 2 đơn (SHIPPED, CANCELLED) + cart       │
  │ user3        │ user123      │ USER  │ Không có đơn → KHÔNG được review           │
  │ user_pending │ user123      │ USER  │ Chưa kích hoạt OTP → không đăng nhập được  │
  └──────────────┴──────────────┴───────┴────────────────────────────────────────────┘

  COUPON TEST:
  ┌──────────┬────────┬─────────────────────────────┐
  │ Code     │ Giảm   │ Tình trạng                  │
  ├──────────┼────────┼─────────────────────────────┤
  │ SALE10   │ 10%    │ Hợp lệ (còn 95/100 lượt)   │
  │ SALE20   │ 20%    │ Hợp lệ (còn 50/50 lượt)    │
  │ VIP50    │ 50%    │ Hợp lệ (còn 2/10 lượt)     │
  │ EXPIRED  │ 15%    │ Đã hết hạn → báo lỗi       │
  │ USED100  │ 25%    │ Hết lượt sử dụng → báo lỗi │
  └──────────┴────────┴─────────────────────────────┘

  RESET TOKEN TEST:
  - test-valid-token-abc123  → hợp lệ (user1, còn 5 phút)
  - test-expired-token-xyz   → hết hạn
  - test-used-token-def456   → đã sử dụng
*/
