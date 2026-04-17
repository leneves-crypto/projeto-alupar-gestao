# Documentação Técnica: SE Rio Novo do Sul 2026

## 1. Schema SQL (Assets, PMOs, Resources)

```sql
-- Tabela de Ativos (Equipment Database)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL, -- Autotransformador, Disjuntor, Seccionadora, etc.
    sector VARCHAR(20) CHECK (sector IN ('345kV', '138kV')),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    franquia_20h BOOLEAN DEFAULT FALSE,
    last_maintenance TIMESTAMP,
    next_maintenance TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Equipes (Resources)
CREATE TABLE teams (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    activity VARCHAR(255),
    leader_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Planos de Manutenção Operacional (PMO Templates)
CREATE TABLE pmo_templates (
    id VARCHAR(20) PRIMARY KEY, -- PMO-03, PMO-07, etc.
    title VARCHAR(255) NOT NULL,
    schema_json JSONB NOT NULL, -- Estrutura dinâmica do formulário
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relatórios de Execução (PMO Reports)
CREATE TABLE pmo_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES maintenance_tasks(id),
    template_id VARCHAR(20) REFERENCES pmo_templates(id),
    asset_tag VARCHAR(50) REFERENCES assets(tag),
    team_id VARCHAR(50) REFERENCES teams(id),
    data_json JSONB NOT NULL, -- Respostas do checklist e medições
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tarefas (Workflows)
CREATE TABLE maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(50) REFERENCES assets(tag),
    team_id VARCHAR(50) REFERENCES teams(id),
    pmo_id VARCHAR(20) REFERENCES pmo_templates(id),
    status VARCHAR(20) CHECK (status IN ('pendente', 'em_execucao', 'concluido')),
    scheduled_date DATE NOT NULL,
    shutdown_window_hours INTEGER DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Modelo JSON: PMO-12 (Seccionadoras)

```json
{
  "templateId": "PMO-12",
  "title": "Manutenção Preventiva em Seccionadoras",
  "sections": [
    {
      "id": "S1",
      "title": "Mecânico e Elétrico",
      "items": [
        { "id": "v1", "label": "Inspeção de cabos de baixa tensão", "type": "boolean" },
        { "id": "v2", "label": "Lubrificação de mancais e articulações", "type": "boolean" },
        { "id": "v3", "label": "Ajuste de alinhamento e simultaneidade", "type": "boolean" },
        { "id": "v4", "label": "Verificação de contatos principais", "type": "boolean" }
      ]
    },
    {
      "id": "S2",
      "title": "Ensaios",
      "items": [
        { "id": "m1", "label": "Testes de resistência de aquecimento (Ω)", "type": "number" },
        { "id": "m2", "label": "Resistência de Contato (μΩ)", "type": "number" },
        { "id": "m3", "label": "Operação manual e motorizada", "type": "boolean" }
      ]
    }
  ]
}
```

## 3. Lógica do Cronômetro de Restrição (Shutdown Timer)

A lógica implementada utiliza o `checkShutdownWindow` para calcular o tempo restante e o percentual de uso da janela.

```typescript
// Sugestão de Codificação (Resumo)
export const checkShutdownWindow = (startTime: Date, durationHours: number) => {
  const now = new Date();
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
  const totalMs = durationHours * 60 * 60 * 1000;
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();
  
  const percentage = (elapsedMs / totalMs) * 100;
  
  return {
    remainingMs,
    percentage,
    isCritical: percentage >= 80, // Alerta de 80%
    isExpired: remainingMs <= 0
  };
};
```
