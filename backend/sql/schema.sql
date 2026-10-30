CREATE DATABASE IF NOT EXISTS soporte_tecnico
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE soporte_tecnico;

CREATE TABLE IF NOT EXISTS tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asunto VARCHAR(150) NOT NULL,
  solicitante VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  categoria ENUM('Hardware', 'Software', 'Redes', 'Accesos', 'Otro') NOT NULL,
  prioridad ENUM('Baja', 'Media', 'Alta') NOT NULL,
  estado ENUM('Abierto', 'En proceso', 'Cerrado') NOT NULL,
  fechaRegistro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
