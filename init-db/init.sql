CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT NULL
);

-- Crear tabla products
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    description TEXT,
    year INT NOT NULL,
    gears INT NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Crear tabla tags
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Create tabla product_tags
CREATE TABLE products_tags (
    products_tags_id SERIAL PRIMARY KEY,
    tag_id INT REFERENCES tags (tag_id),
    product_id INT REFERENCES products (product_id),
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla states
CREATE TABLE states (
    state_id SERIAL PRIMARY KEY,
    state_name VARCHAR(50) NOT NULL,
    description TEXT
);

-- Crear tabla orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users (user_id),
    product_id INT REFERENCES products (product_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla state_history
CREATE TABLE state_history (
    history_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders (order_id),
    state_id INT REFERENCES states (state_id),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_state BOOLEAN DEFAULT FALSE
);


-- Insertar datos en la tabla users
INSERT INTO users (name, email) VALUES
('John Doe', 'john.doe@example.com'),
('Jane Smith', 'jane.smith@example.com'),
('Alice Johnson', 'alice.johnson@example.com'),
('Bob Brown', 'bob.brown@example.com');

-- Insertar datos en la tabla products
INSERT INTO products (product_id, model, year, gears) VALUES
(12, 'GLA', 2021, 6),
(13, 'GLB', 2021, 6),
(14, 'GLC', 2021, 8),
(15, 'GLE', 2021, 9),
(16, 'GLS', 2021, 9),
(21, 'CLA', 2017, 6),
(22, 'CLA', 2021, 6),
(23, 'CLS', 2021, 9),
(24, 'A-Class', 2021, 6),
(25, 'B-Class', 2021, 6),
(26, 'C-Class', 2021, 9),
(27, 'E-Class', 2021, 9);

INSERT INTO tags (name) VALUES
('SUV'),
('Mercedes'),
('Petrol'),
('Coupe'),
('Hatchback'),
('Sedan');


INSERT INTO products_tags (product_id, tag_id) VALUES
-- GLA
(12, 1), -- SUV
(12, 2), -- Mercedes
(12, 3), -- Petrol
(13, 1), -- SUV
(13, 2), -- Mercedes
(13, 3), -- Petrol
(14, 1), -- SUV
(14, 2), -- Mercedes
(14, 3), -- Petrol
(15, 1), -- SUV
(15, 2), -- Mercedes
(15, 3), -- Petrol
(16, 1), -- SUV
(16, 2), -- Mercedes
(16, 3), -- Petrol
(21, 4), -- Coupe
(21, 2), -- Mercedes
(21, 3), -- Petrol
(22, 4), -- Coupe
(22, 2), -- Mercedes
(22, 3), -- Petrol
(23, 4), -- Coupe
(23, 2), -- Mercedes
(23, 3), -- Petrol
(24, 5), -- Hatchback
(24, 2), -- Mercedes
(24, 3), -- Petrol
(25, 5), -- Hatchback
(25, 2), -- Mercedes
(25, 3), -- Petrol
(26, 6), -- Sedan
(26, 2), -- Mercedes
(26, 3), -- Petrol
(27, 6), -- Sedan
(27, 2), -- Mercedes
(27, 3); -- Petrol

-- Insertar datos en la tabla states
INSERT INTO states (state_name, description) VALUES
('Pending', 'The request is pending'),
('Shipped', 'The request has been shipped'),
('Delivered', 'The request has been delivered'),
('Cancelled', 'The request has been cancelled');

-- Insert 50 orders
INSERT INTO orders (user_id, product_id) VALUES
(1, 12),
(2, 13),
(3, 14),
(4, 15),
(1, 16),
(2, 21),
(3, 22),
(4, 23),
(1, 24),
(2, 25),
(3, 26),
(4, 27),
(1, 12),
(2, 13),
(3, 14),
(4, 15),
(1, 16),
(2, 21),
(3, 22),
(4, 23),
(1, 24),
(2, 25),
(3, 26),
(4, 27),
(1, 12),
(2, 13),
(3, 14),
(4, 15),
(1, 16),
(2, 21),
(3, 22),
(4, 23),
(1, 24),
(2, 25),
(3, 26),
(4, 27),
(1, 12),
(2, 13),
(3, 14),
(4, 15),
(1, 16),
(2, 21),
(3, 22),
(4, 23),
(1, 24),
(2, 25),
(3, 26),
(4, 27);

-- Insert state transitions for each order
-- Assuming state_id: 1 = Pending, 2 = Shipped, 3 = Delivered, 4 = Cancelled

-- Orders that are delivered
INSERT INTO state_history (order_id, state_id, current_state) VALUES
(1, 1, FALSE), (1, 2, FALSE), (1, 3, TRUE),
(2, 1, FALSE), (2, 2, FALSE), (2, 3, TRUE),
(3, 1, FALSE), (3, 2, FALSE), (3, 3, TRUE),
(4, 1, FALSE), (4, 2, FALSE), (4, 3, TRUE),
(5, 1, FALSE), (5, 2, FALSE), (5, 3, TRUE),
(6, 1, FALSE), (6, 4, TRUE),
(7, 1, FALSE), (7, 4, TRUE),
(8, 1, FALSE), (8, 4, TRUE),
(9, 1, FALSE), (9, 4, TRUE),
(10, 1, FALSE), (10, 4, TRUE),
(11, 1, FALSE), (11, 2, TRUE),
(12, 1, FALSE), (12, 2, TRUE),
(13, 1, FALSE), (13, 2, TRUE),
(14, 1, FALSE), (14, 2, TRUE),
(15, 1, FALSE), (15, 2, TRUE),
(16, 1, TRUE),
(17, 1, TRUE),
(18, 1, TRUE),
(19, 1, TRUE),
(20, 1, TRUE),
(21, 1, FALSE), (21, 2, TRUE), (21, 3, TRUE),
(22, 1, FALSE), (22, 2, FALSE), (22, 3, TRUE),
(23, 1, FALSE), (23, 2, FALSE), (23, 3, TRUE),
(24, 1, FALSE), (24, 2, FALSE), (24, 3, TRUE),
(25, 1, FALSE), (25, 2, FALSE), (25, 3, TRUE),
(26, 1, FALSE), (26, 4, TRUE),
(27, 1, FALSE), (27, 4, TRUE),
(28, 1, FALSE), (28, 4, TRUE),
(29, 1, FALSE), (29, 4, TRUE),
(30, 1, FALSE), (30, 4, TRUE),
(31, 1, FALSE), (31, 2, TRUE),
(32, 1, FALSE), (32, 2, TRUE),
(33, 1, FALSE), (33, 2, TRUE),
(34, 1, FALSE), (34, 2, TRUE),
(35, 1, FALSE), (35, 2, TRUE),
(36, 1, TRUE),
(37, 1, TRUE),
(38, 1, TRUE),
(39, 1, TRUE),
(40, 1, TRUE),
(41, 1, FALSE), (41, 2, FALSE), (41, 3, TRUE),
(42, 1, FALSE), (42, 2, FALSE), (42, 3, TRUE),
(43, 1, FALSE), (43, 2, FALSE), (43, 3, TRUE),
(44, 1, FALSE), (44, 2, FALSE), (44, 3, TRUE),
(45, 1, FALSE), (45, 2, FALSE), (45, 3, TRUE),
(46, 1, FALSE), (46, 4, TRUE),
(47, 1, FALSE), (47, 4, TRUE),
(48, 1, TRUE), (48, 4, TRUE);
