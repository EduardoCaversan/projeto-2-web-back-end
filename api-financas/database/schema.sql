CREATE DATABASE IF NOT EXISTS api_financas;
USE api_financas;

CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL,
  cpf         CHAR(11)     NOT NULL,                 -- só dígitos
  senha_hash  VARCHAR(100) NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_email UNIQUE (email),
  CONSTRAINT uq_usuarios_cpf   UNIQUE (cpf)
);

CREATE TABLE categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  nome        VARCHAR(60) NOT NULL,
  tipo        ENUM('entrada', 'saida') NOT NULL,
  CONSTRAINT uq_categorias_nome UNIQUE (usuario_id, nome, tipo),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE fontes_destinos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT NOT NULL,
  nome            VARCHAR(60) NOT NULL,
  tipo            ENUM('renda', 'conta', 'cartao_credito') NOT NULL,
  dia_fechamento  TINYINT NULL,
  dia_vencimento  TINYINT NULL,
  limite          DECIMAL(12, 2) NULL,
  CONSTRAINT uq_fontes_nome UNIQUE (usuario_id, nome),
  CONSTRAINT ck_dias CHECK (
    (dia_fechamento IS NULL OR dia_fechamento BETWEEN 1 AND 31) AND
    (dia_vencimento IS NULL OR dia_vencimento BETWEEN 1 AND 31)
  ),
  CONSTRAINT ck_cartao CHECK (
    tipo <> 'cartao_credito' OR
    (dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL AND limite IS NOT NULL)
  ),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE lancamentos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id          INT NOT NULL,
  tipo                ENUM('entrada', 'saida') NOT NULL,
  descricao           VARCHAR(120)   NOT NULL,
  valor               DECIMAL(12, 2) NOT NULL,
  data                DATE           NOT NULL,
  categoria_id        INT NOT NULL,
  fonte_destino_id    INT NOT NULL,
  parcela_atual       TINYINT NOT NULL DEFAULT 1,
  total_parcelas      TINYINT NOT NULL DEFAULT 1,
  grupo_parcelamento  CHAR(36) NULL,                 -- mesmo valor em todas as parcelas
  criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_valor    CHECK (valor > 0),
  CONSTRAINT ck_parcelas CHECK (total_parcelas BETWEEN 1 AND 48
                                AND parcela_atual BETWEEN 1 AND total_parcelas),
  FOREIGN KEY (usuario_id)       REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id)     REFERENCES categorias(id),
  FOREIGN KEY (fonte_destino_id) REFERENCES fontes_destinos(id),
  INDEX idx_lancamentos_usuario_data (usuario_id, data)
);
