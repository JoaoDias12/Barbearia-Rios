/*
 * EXEMPLO DE ESTRUTURA FIREBASE REALTIME DATABASE
 *
 * Este arquivo agora e um JavaScript valido.
 * Antes ele quebrava porque o objeto JSON estava solto no arquivo.
 */

const FIREBASE_EXAMPLE_STRUCTURE = {
  agendamentos: {
    "-N5x_K9_pL2m3n4o5p6q": {
      nome: "Joao Silva",
      telefone: "(11) 99999-9999",
      email: "joao@example.com",
      servico: "corte-feminino",
      data: "2026-12-25",
      hora: "14:30",
      mensagem: "Preferencia de corte curto com franja",
      timestamp: "2026-05-01T10:30:45.123Z",
      status: "confirmado"
    },
    "-N5x_L0aQm3n4o5p6q7r": {
      nome: "Maria Santos",
      telefone: "(11) 98888-8888",
      email: "maria@example.com",
      servico: "coloracao",
      data: "2026-12-26",
      hora: "10:00",
      mensagem: "Tonalidade loiro claro",
      timestamp: "2026-05-01T11:15:30.456Z",
      status: "confirmado"
    }
  },
  servicos: {
    "corte-feminino": {
      nome: "Corte Feminino",
      preco: 50,
      duracao: 45,
      descricao: "Cortes modernos e personalizados para realcar seu estilo"
    },
    "corte-masculino": {
      nome: "Corte Masculino",
      preco: 35,
      duracao: 30,
      descricao: "Estilos classicos e trends para homens modernos"
    },
    barba: {
      nome: "Barba Premium",
      preco: 30,
      duracao: 20,
      descricao: "Acabamento perfeito com lamina e design"
    },
    coloracao: {
      nome: "Coloracao",
      preco: 80,
      duracao: 90,
      descricao: "Cores vibrantes com produtos de qualidade superior"
    },
    tratamento: {
      nome: "Tratamento Capilar",
      preco: 60,
      duracao: 60,
      descricao: "Hidratacao profunda e restauracao dos fios"
    },
    progressiva: {
      nome: "Escova Progressiva",
      preco: 120,
      duracao: 120,
      descricao: "Cabelos lisos e brilhantes por ate 3 meses"
    }
  },
  usuarios: {
    "admin@studio.com": {
      nome: "Administrador",
      email: "admin@studio.com",
      role: "admin",
      ativo: true
    }
  }
};

const FIREBASE_REALTIME_RULES_EXAMPLE = {
  rules: {
    agendamentos: {
      ".read": "auth != null",
      ".write": "auth != null || !data.exists()",
      ".validate": "newData.hasChildren(['nome', 'telefone', 'email', 'servico', 'data', 'hora'])"
    },
    servicos: {
      ".read": true,
      ".write": "root.child('usuarios').child(auth.token.email).child('role').val() === 'admin'"
    },
    usuarios: {
      ".read": "auth != null",
      ".write": "root.child('usuarios').child(auth.token.email).child('role').val() === 'admin'"
    }
  }
};

/*
 * Como usar:
 * - Consulte FIREBASE_EXAMPLE_STRUCTURE para ver a estrutura sugerida.
 * - Consulte FIREBASE_REALTIME_RULES_EXAMPLE para copiar a base das regras.
 */
