import { PMOSection } from '../types';

export interface PMOTemplate {
  title: string;
  sections: PMOSection[];
  technicalFields?: string[];
}

export const PMO_TEMPLATES: Record<string, PMOTemplate> = {
  'PMO-12': {
    title: 'MANUTENÇÃO PREVENTIVA DE SECCIONADOR',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'Tipo de acionamento', 'N° de Série do Mecanismo', 'Tensão nominal', 'Corrente nominal (In)', 'Frequência nominal', 'Massa do polo', 'Massa total', 'Tensão de comando VCC', 'Tensão do motor VCA'],
    sections: [
      {
        title: 'INSPEÇÃO VISUAL / ACIONAMENTO ELÉTRICO',
        items: [
          { id: 'v1', description: 'Limpeza de conexões' },
          { id: 'v2', description: 'Pintura e oxidações' },
          { id: 'v3', description: 'Alinhamento dos contatos (F e M)' },
          { id: 'v4', description: 'Lubrificação do mecanismo' },
          { id: 'v5', description: 'Pinagem dos tubos' },
          { id: 'v6', description: 'Abertura' },
          { id: 'v7', description: 'Fechamento' },
          { id: 'v8', description: 'Simultaneidade' },
          { id: 'v9', description: 'Sinalizações e TAG' },
          { id: 'v10', description: 'Conexões Bornes BT' },
        ]
      },
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Limpeza, lubrificação ou substituição dos contatos' },
          { id: 'a2', description: 'Inspeção dos cabos de baixa tensão e de aterramento' },
          { id: 'a3', description: 'Inspeção geral do estado de conservação' },
          { id: 'a4', description: 'Verificação da necessidade de limpeza, lubrificação ou substituição dos contatos' },
          { id: 'a5', description: 'Verificação de ajustes, alinhamento e simultaneidade de operação das fases' },
          { id: 'a6', description: 'Verificação dos ajustes das chaves de fim de curso' },
          { id: 'a7', description: 'Inspeção do armário de comando e seus componentes' },
          { id: 'a8', description: 'Inspeção e limpeza de isoladores, das colunas de suporte e dos flanges dos isoladores' },
          { id: 'a9', description: 'Lubrificação dos principais rolamentos e articulações das hastes de acoplamento' },
          { id: 'a10', description: 'Verificação da operação da resistência de aquecimento e iluminação interna do armário' },
          { id: 'a11', description: 'Verificação do funcionamento dos controles locais e da operação manual' },
          { id: 'a12', description: 'Inspeção geral e reaperto das conexões' },
        ]
      },
      {
        title: 'MEDIÇÕES E ENSAIOS',
        items: [
          { id: 'm1', description: 'Medição do tempo de abertura (s)', type: 'measurement' },
          { id: 'm2', description: 'Medição do tempo de fechamento (s)', type: 'measurement' },
          { id: 'm3', description: 'Medição da Corrente do Motor - Abertura (A)', type: 'measurement' },
          { id: 'm4', description: 'Medição da Corrente do Motor - Fechamento (A)', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE CONTATOS (µΩ)',
        items: [
          { id: 'erc1', description: 'Corrente aplicada (A)', type: 'measurement' },
          { id: 'erc2', description: 'Polo A', type: 'measurement' },
          { id: 'erc3', description: 'Polo B', type: 'measurement' },
          { id: 'erc4', description: 'Polo V', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE ISOLAÇÃO (MΩ)',
        items: [
          { id: 'eri1', description: 'Tensão Aplicada (V)', type: 'measurement' },
          { id: 'eri2', description: 'Polo A x Terra', type: 'measurement' },
          { id: 'eri3', description: 'Polo B x Terra', type: 'measurement' },
          { id: 'eri4', description: 'Polo V x Terra', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-03': {
    title: 'MANUTENÇÃO PREVENTIVA DE TRANSFORMADOR',
    technicalFields: ['Fabricante', 'Tipo', 'N° Série', 'Ano de fabricação', 'Tp. do Óleo', 'N° Fase', 'Potência', 'Tensão Primário', 'Tensão Secundário', 'Tensão Terciário', 'Freq.', 'Massa Parte Ativa (Kg)', 'Massa Total (Kg)', 'Volume de óleo à 25 °C (L)'],
    sections: [
      {
        title: 'INSPEÇÃO VISUAL / ACIONAMENTO ELÉTRICO',
        items: [
          { id: 'v1', description: 'Reaperto das Conexões de AT' },
          { id: 'v2', description: 'Pintura e oxidações' },
          { id: 'v3', description: 'Reaperto Conexões Bornes BT' },
          { id: 'v4', description: 'Relé Buchholz 1º Estágio' },
          { id: 'v5', description: 'Relé Buchholz 2º Estágio' },
          { id: 'v6', description: 'Acionamento manual da ventilação Grupo 01' },
          { id: 'v7', description: 'Acionamento manual da ventilação Grupo 02' },
          { id: 'v8', description: 'Acionamento manual do Buchholz' },
          { id: 'v9', description: 'Acionamento manual do DAP' },
          { id: 'v10', description: 'Acionamento manual do TM' },
        ]
      },
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Ensaios de fator de potência e de capacitância das buchas com derivação capacitiva' },
          { id: 'a2', description: 'Inspeção do estado geral de conservação: limpeza, pintura e corrosão nas partes metálicas' },
          { id: 'a3', description: 'Verificação da existência de vazamentos de óleo isolante' },
          { id: 'a4', description: 'Verificação do aterramento do tanque principal' },
          { id: 'a5', description: 'Verificação do estado de saturação do material secante utilizado na preservação do óleo isolante' },
          { id: 'a6', description: 'Verificação do funcionamento dos ventiladores e bombas do sistema de resfriamento' },
          { id: 'a7', description: 'Verificação dos indicadores de nível do óleo isolante e dos indicadores de temperatura' },
          { id: 'a8', description: 'Verificação do aterramento do Núcleo' },
          { id: 'a9', description: 'Inspeção da caixa de acionamento motorizado do comutador' },
          { id: 'a10', description: 'Verificação da comutação sob carga na função manual e automática' },
          { id: 'a11', description: 'Verificação do adequado funcionamento das bolsas e membranas do conservador' },
          { id: 'a12', description: 'Verificação do estado de conservação das vedações dos painéis' },
          { id: 'a13', description: 'Verificação do funcionamento dos circuitos do relé de gás, do relé de fluxo e da válvula de alívio de pressão do tanque principal' },
          { id: 'a14', description: 'Verificação do nível do óleo do compartimento do comutador' },
          { id: 'a15', description: 'Verificação da existência de vazamentos de gás' },
          { id: 'a16', description: 'Verificação da operação da resistência de aquecimento e iluminação interna do cubículo individual' },
          { id: 'a17', description: 'Ensaios de fator de potência, de resistência de isolamento e de resistência ôhmica dos enrolamentos' },
        ]
      },
      {
        title: 'TRANSFORMADORES COM COMUTADOR EM CARGA, caso aplicável',
        items: [
          { id: 'c1', description: 'Inspeção interna do comutador' },
          { id: 'c2', description: 'Verificação do desgaste dos contatos elétricos e troca dos componentes desgastados' },
          { id: 'c3', description: 'Verificação do estado do óleo isolante dos comutadores (quando aplicável)' },
          { id: 'c4', description: 'Verificação do estado das conexões elétricas do comutador e do sistema de isolação' },
          { id: 'c5', description: 'Ensaio de relação de transformação nos pontos de comutação central e extremos' },
          { id: 'c6', description: 'Verificação do mecanismo de acionamento do comutador' },
        ]
      },
      {
        title: 'FATOR DE PONTÊNCIA DE ISOLAMENTO DE CAPACITÂNCIA DAS BUCHAS',
        items: [
          { id: 'fb1', description: 'Bucha H1 (C1) - Capacitância (pF)', type: 'measurement' },
          { id: 'fb2', description: 'Bucha H1 (C1) - F %', type: 'measurement' },
          { id: 'fb3', description: 'Bucha X1 (C1) - Capacitância (pF)', type: 'measurement' },
          { id: 'fb4', description: 'Bucha X1 (C1) - F %', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'CPC-100 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'CP-TD12 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-08': {
    title: 'MANUTENÇÃO PREVENTIVA DE CUBÍCULO',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'Tensão nominal (Un)', 'Nº série', 'Corrente nominal', 'Frequência nominal', 'Nível de isolamento nominal'],
    sections: [
      {
        title: 'INSPEÇÃO VISUAL / ACIONAMENTO ELÉTRICO',
        items: [
          { id: 'v1', description: 'Limpeza de conexões' },
          { id: 'v2', description: 'Pintura e oxidações' },
          { id: 'v3', description: 'Sinalizações' },
          { id: 'v4', description: 'Barramentos e conexões' },
        ]
      },
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Verificar estado de conservação' },
          { id: 'a2', description: 'Verificar as partes metálicas quanto a existência de corrosão' },
          { id: 'a3', description: 'Verificar sistema de aterramento do equipamento' },
          { id: 'a4', description: 'Verificar o funcionamento da resistência de aquecimento e iluminação' },
          { id: 'a5', description: 'Verificar o estado dos isoladores do cubículo' },
          { id: 'a6', description: 'Verificar se existe trincas, fissuras ou sinal de fuga' },
          { id: 'a7', description: 'Verificar estado das fechaduras das portas' },
          { id: 'a8', description: 'Fazer reaperto em todas as conexões internas do cubículo' },
          { id: 'a9', description: 'Verificar estado dos equipamentos interno ao cubículo' },
          { id: 'a10', description: 'Verificar a presença de humidade interna dos cubículos' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE ISOLAÇÃO (MΩ)',
        items: [
          { id: 'eri1', description: 'Tensão Aplicada (V)', type: 'measurement' },
          { id: 'eri2', description: 'Polo A x Terra', type: 'measurement' },
          { id: 'eri3', description: 'Polo B x Terra', type: 'measurement' },
          { id: 'eri4', description: 'Polo V x Terra', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-11': {
    title: 'MANUTENÇÃO PREVENTIVA DE TP',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'M.Total (Kg)', 'V. Óleo(L)', 'Número de núcleos', 'Tensão nominal (Kv)', 'C1(pF)', 'C2(pF)', 'Cn(pF)'],
    sections: [
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Verificações do estado geral de conservação' },
          { id: 'a2', description: 'Verificações da limpeza de isoladores' },
          { id: 'a3', description: 'Reposição de óleo e/ou gás SF6' },
          { id: 'a4', description: 'Verificar as partes metálicas quanto a existência de corrosão' },
          { id: 'a5', description: 'Verificar o estado de poluição nas peças de porcelana' },
          { id: 'a6', description: 'Inspeção geral das conexões' },
          { id: 'a7', description: 'Verificação da existência de vazamentos de óleo isolante e/ou gás' },
          { id: 'a8', description: 'Verificação do estado do material secante utilizado' },
          { id: 'a9', description: 'Verificar vedação da caixa de interligação e secundário' },
          { id: 'a10', description: 'Verificar o funcionamento da resistência de aquecimento e iluminação da caixa de interligação' },
        ]
      },
      {
        title: 'FATOR DE POTÊNCIA',
        items: [
          { id: 'fp1', description: 'Tensão aplicada (A)', type: 'measurement' },
          { id: 'fp2', description: 'Polo A', type: 'measurement' },
          { id: 'fp3', description: 'Polo B', type: 'measurement' },
          { id: 'fp4', description: 'Polo V', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE ISOLAÇÃO (MΩ)',
        items: [
          { id: 'eri1', description: 'Tensão Aplicada (V)', type: 'measurement' },
          { id: 'eri2', description: 'Polo A x Terra', type: 'measurement' },
          { id: 'eri3', description: 'Polo B x Terra', type: 'measurement' },
          { id: 'eri4', description: 'Polo V x Terra', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-09': {
    title: 'MANUTENÇÃO PREVENTIVA DE PARA-RAIOS',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'Tensão nominal (Un)', 'I. nom. desc. (Ka)', 'N° de Série', 'Classe', 'Freq.', 'Instalação (Ao Tempo/Abrigada)'],
    sections: [
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Verificações do estado geral de conservação ferragens e porcelana' },
          { id: 'a2', description: 'Verificações da limpeza de isoladores' },
          { id: 'a3', description: 'Verificar o estado do aterramento, continuidade do ponto de aterramento do para-raios e a malha de terra' },
          { id: 'a4', description: 'Registro do contador de descargas', type: 'measurement' },
          { id: 'a5', description: 'Inspeção geral das conexões' },
          { id: 'a6', description: 'Verificações dos miliamperímetros e dispositivo contador de descargas, caso existam' },
          { id: 'a7', description: 'Medição da corrente de fuga', type: 'measurement' },
          { id: 'a8', description: 'Ensaios elétricos se necessário' },
        ]
      },
      {
        title: 'FATOR DE POTÊNCIA',
        items: [
          { id: 'fp1', description: 'Tensão aplicada (A)', type: 'measurement' },
          { id: 'fp2', description: 'Polo A', type: 'measurement' },
          { id: 'fp3', description: 'Polo B', type: 'measurement' },
          { id: 'fp4', description: 'Polo V', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE ISOLAÇÃO (MΩ)',
        items: [
          { id: 'eri1', description: 'Tensão Aplicada (V)', type: 'measurement' },
          { id: 'eri2', description: 'Polo A x Terra', type: 'measurement' },
          { id: 'eri3', description: 'Polo B x Terra', type: 'measurement' },
          { id: 'eri4', description: 'Polo V x Terra', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-10': {
    title: 'MANUTENÇÃO PREVENTIVA DE TC',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'M.Total (Kg)', 'V. Óleo(L)', 'Número de núcleos', 'Tensão nominal (Kv)', 'Cor. P(A)', 'Cor. Sec. (A)'],
    sections: [
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Verificações do estado geral de conservação' },
          { id: 'a2', description: 'Verificações da limpeza de isoladores' },
          { id: 'a3', description: 'Reposição de óleo e/ou gás SF6' },
          { id: 'a4', description: 'Verificar as partes metálicas quanto a existência de corrosão' },
          { id: 'a5', description: 'Verificar o estado de poluição nas peças de porcelana' },
          { id: 'a6', description: 'Inspeção geral das conexões' },
          { id: 'a7', description: 'Verificação da existência de vazamentos de óleo isolante e/ou gás' },
          { id: 'a8', description: 'Verificação do estado do material secante utilizado' },
          { id: 'a9', description: 'Verificar vedação da caixa de interligação e secundário' },
          { id: 'a10', description: 'Verificar o funcionamento da resistência de aquecimento e iluminação da caixa de interligação' },
        ]
      },
      {
        title: 'FATOR DE POTÊNCIA',
        items: [
          { id: 'fp1', description: 'Tensão aplicada (A)', type: 'measurement' },
          { id: 'fp2', description: 'Polo A', type: 'measurement' },
          { id: 'fp3', description: 'Polo B', type: 'measurement' },
          { id: 'fp4', description: 'Polo V', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE ISOLAÇÃO (MΩ)',
        items: [
          { id: 'eri1', description: 'Tensão Aplicada (V)', type: 'measurement' },
          { id: 'eri2', description: 'Polo A x Terra', type: 'measurement' },
          { id: 'eri3', description: 'Polo B x Terra', type: 'measurement' },
          { id: 'eri4', description: 'Polo V x Terra', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-07': {
    title: 'MANUTENÇÃO PREVENTIVA DE DISJUNTOR',
    technicalFields: ['Fabricante', 'Tipo', 'Ano de fabricação', 'Tipo do mecanismo de op', 'Nº série do mecanismo de op', 'N° série do disjuntor', 'Tensão nominal', 'Corrente nominal (In)', 'Frequência nominal', 'Pressão nominal SF6', 'Baixa pressão 1º estágio SF6', 'Baixa pressão 2º estágio SF6', 'Potência nominal da bobina de abertura', 'Potência nominal da bobina de fechamento', 'Massa do gás SF6', 'Massa total com gás'],
    sections: [
      {
        title: 'INSPEÇÃO VISUAL / ACIONAMENTO ELÉTRICO',
        items: [
          { id: 'v1', description: 'Limpeza de conexões' },
          { id: 'v2', description: 'Pintura e oxidações' },
          { id: 'v3', description: 'Verificar pressão de SF6' },
          { id: 'v4', description: 'Iluminação e resistência de desumidificação do armário' },
          { id: 'v5', description: 'Estado da porcelana do disjuntor' },
          { id: 'v6', description: 'Abertura' },
          { id: 'v7', description: 'Fechamento' },
          { id: 'v8', description: 'Contador de operações (FA/FB/FV)', type: 'measurement' },
        ]
      },
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Execução de ensaios de resistência de contatos do circuito principal' },
          { id: 'a2', description: 'Lubrificação, onde aplicável' },
          { id: 'a3', description: 'Remoção de indícios de ferrugem' },
          { id: 'a4', description: 'Verificação das bobinas e sistema antibombeamento' },
          { id: 'a5', description: 'Verificação de vazamentos de gás ou óleo' },
          { id: 'a6', description: 'Verificação do tanque de ar e do óleo do compressor' },
          { id: 'a7', description: 'Verificações do circuito de comando e sinalizações e dos níveis de alarmes' },
          { id: 'a8', description: 'Inspeção geral das conexões' },
          { id: 'a9', description: 'Execução de ensaios nas buchas condensivas com tap capacitivo' },
          { id: 'a10', description: 'Medição dos tempos de operação: abertura e fechamento' },
          { id: 'a11', description: 'Teste do comando local e a distância e acionamento do relé de discordância de polos' },
          { id: 'a12', description: 'Verificação de vazamento em circuitos hidráulicos e amortecedores' },
          { id: 'a13', description: 'Verificação do funcionamento de densímetros, pressostatos e manostatos' },
          { id: 'a14', description: 'Verificação geral na pintura, estado das porcelanas e corrosão' },
          { id: 'a15', description: 'Verificações do sistema de acionamento e acessórios' },
          { id: 'a16', description: 'Verificar sistema de iluminação e resistência de aquecimento' },
        ]
      },
      {
        title: 'ENSAIOS DE RESISTÊNCIA DE CONTATOS (µΩ)',
        items: [
          { id: 'erc1', description: 'Corrente aplicada (A)', type: 'measurement' },
          { id: 'erc2', description: 'Polo A', type: 'measurement' },
          { id: 'erc3', description: 'Polo B', type: 'measurement' },
          { id: 'erc4', description: 'Polo V', type: 'measurement' },
        ]
      },
      {
        title: 'ENSAIOS DE OSCILOGRAFIA EM DISJUNTOR',
        items: [
          { id: 'eo1', description: 'Bobina 1 - CLOSED (FA/FB/FV)', type: 'measurement' },
          { id: 'eo2', description: 'Bobina 1 - OPEN (FA/FB/FV)', type: 'measurement' },
          { id: 'eo3', description: 'Bobina 2 - CLOSED (FA/FB/FV)', type: 'measurement' },
          { id: 'eo4', description: 'Bobina 2 - OPEN (FA/FB/FV)', type: 'measurement' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Instrumento 2 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e4', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e5', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-18': {
    title: 'MANUTENÇÃO PREVENTIVA DE BARRAMENTO',
    sections: [
      {
        title: 'ATIVIDADES',
        items: [
          { id: 'a1', description: 'Efetuar limpeza e verificar o estado geral dos barramentos, pingados' },
          { id: 'a2', description: 'Reaperto geral nos barramentos e pingados com Torquímetro' },
          { id: 'a3', description: 'Estado dos isoladores, trincas, manchas, fissuras' },
          { id: 'a4', description: 'Verificar o estado geral das conexões dos barramentos e pingados' },
          { id: 'a5', description: 'Verificar o estado de conservação dos pórticos' },
          { id: 'a6', description: 'Conferência das emendas e conexões' },
        ]
      },
      {
        title: 'EQUIPAMENTOS UTILIZADOS',
        items: [
          { id: 'e1', description: 'Instrumento 1 (Modelo / N° Série)', type: 'measurement' },
          { id: 'e2', description: 'Termo-higrômetro (Modelo / N° Série)', type: 'measurement' },
          { id: 'e3', description: 'Temperatura ambiente (°C)', type: 'measurement' },
          { id: 'e4', description: 'Umidade relativa do ar (%)', type: 'measurement' },
        ]
      }
    ]
  },
  'PMO-21': {
    title: 'MANUTENÇÃO PREVENTIVA DE PROTEÇÃO, COMANDO E CONTROLE',
    technicalFields: ['Painel', 'Relé Principal', 'N° Série', 'Versão Firmware'],
    sections: [
      {
        title: 'INSPEÇÃO E TESTES DE COMANDO',
        items: [
          { id: 'p1', description: 'Verificação de alarmes no painel' },
          { id: 'p2', description: 'Teste de sinalização local/remoto' },
          { id: 'p3', description: 'Teste de trip via relé (Abertura)' },
          { id: 'p4', description: 'Teste de fechamento via comando' },
          { id: 'p5', description: 'Verificação de fontes VCC' },
          { id: 'p6', description: 'Limpeza e reaperto de bornes' },
        ]
      },
      {
        title: 'ENSAIOS EM RELÉS',
        items: [
          { id: 'r1', description: 'Leitura de correntes/tensões secundárias' },
          { id: 'r2', description: 'Verificação de parametrização' },
          { id: 'r3', description: 'Download de oscilografias' },
          { id: 'r4', description: 'Teste de pick-up das unidades de sobrecorrente' },
        ]
      }
    ]
  }
};
