
CREATE DATABASE IF NOT EXISTS nekogold_db;
USE nekogold_db;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    carat INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    weight DECIMAL(10, 2) NOT NULL,
    supplier VARCHAR(255),
    supplierPrice DECIMAL(15, 2),
    price DECIMAL(15, 2) NOT NULL,
    stockCount INT DEFAULT 1,
    purchaseDate DATE,
    imageUrl TEXT,
    brilliant TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    cashDebt DECIMAL(15, 2) DEFAULT 0,
    goldDebt DECIMAL(10, 2) DEFAULT 0,
    address TEXT,
    title VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    productId VARCHAR(50),
    productName VARCHAR(255),
    productCode VARCHAR(50),
    type VARCHAR(50),
    customerName VARCHAR(255),
    price DECIMAL(15, 2),
    discount DECIMAL(15, 2),
    total DECIMAL(15, 2),
    date DATETIME,
    status VARCHAR(50),
    weight DECIMAL(10, 2),
    carat INT,
    supplier VARCHAR(255),
    brilliant TEXT,
    imageUrl TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scrap Gold table
CREATE TABLE IF NOT EXISTS scraps (
    id VARCHAR(50) PRIMARY KEY,
    weight DECIMAL(10, 2),
    carat INT,
    pricePerGram DECIMAL(10, 2),
    totalPrice DECIMAL(15, 2),
    date DATETIME,
    note TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    data JSON,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
