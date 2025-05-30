import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Default categories and subcategories for financial transactions
const defaultCategories = [
  // Expense categories
  {
    name: 'Alimentação',
    description:
      'Gastos relacionados à alimentação, incluindo compras de supermercado e refeições fora de casa.',
    type: 'DEBIT',
    color: '#FF5733', // Reddish-orange
    subcategories: [
      {
        name: 'Mercado',
        description:
          'Compras em supermercados, mercearias e feiras para consumo doméstico.',
      },
      {
        name: 'Restaurante',
        description:
          'Refeições em restaurantes, bares e estabelecimentos similares.',
      },
      {
        name: 'Lanches',
        description:
          'Gastos com lanches rápidos, cafés e pequenas refeições durante o dia.',
      },
      {
        name: 'Delivery',
        description:
          'Pedidos de comida por aplicativos ou serviços de entrega.',
      },
    ],
  },
  {
    name: 'Banco e Impostos',
    description:
      'Despesas financeiras relacionadas a serviços bancários, empréstimos e obrigações fiscais.',
    type: 'DEBIT',
    color: '#C70039', // Dark red
    subcategories: [
      {
        name: 'Juros',
        description:
          'Pagamento de juros sobre empréstimos, financiamentos ou cartões de crédito.',
      },
      {
        name: 'Tarifa banco',
        description:
          'Taxas cobradas por serviços bancários como manutenção de conta e transferências.',
      },
      {
        name: 'FGTS',
        description:
          'Contribuições para o Fundo de Garantia do Tempo de Serviço.',
      },
      {
        name: 'INSS',
        description:
          'Contribuições para o Instituto Nacional do Seguro Social.',
      },
      {
        name: 'IR',
        description: 'Pagamentos de Imposto de Renda e ajustes anuais.',
      },
      {
        name: 'Empréstimo Pessoal',
        description:
          'Parcelas de empréstimos pessoais contratados junto a instituições financeiras.',
      },
    ],
  },
  {
    name: 'Compras',
    description:
      'Aquisições de bens duráveis e não duráveis para uso pessoal ou doméstico.',
    type: 'DEBIT',
    color: '#900C3F', // Burgundy
    subcategories: [
      {
        name: 'Vestuário Profissional',
        description:
          'Roupas e acessórios específicos para uso no ambiente de trabalho.',
      },
      {
        name: 'Perfumaria',
        description: 'Produtos de perfumaria, cosméticos e fragrâncias.',
      },
      {
        name: 'Vestuario',
        description: 'Roupas, calçados e acessórios para uso casual ou diário.',
      },
      {
        name: 'Presentes',
        description:
          'Itens adquiridos para presentear outras pessoas em ocasiões especiais.',
      },
      {
        name: 'Eletronicos e Utensilios',
        description:
          'Dispositivos eletrônicos, eletrodomésticos e utensílios para casa.',
      },
    ],
  },
  {
    name: 'Educação e Desenvolvimento',
    description:
      'Investimentos em formação acadêmica, capacitação profissional e crescimento pessoal.',
    type: 'DEBIT',
    color: '#581845', // Purple
    subcategories: [
      {
        name: 'Escola/Faculdade',
        description:
          'Mensalidades e taxas de instituições de ensino formal, como escolas e universidades.',
      },
      {
        name: 'Cursos',
        description:
          'Pagamentos por cursos de curta ou média duração para aprimoramento de habilidades.',
      },
      {
        name: 'Livros e materiais didáticos',
        description:
          'Aquisição de livros, apostilas e outros materiais para estudo.',
      },
      {
        name: 'Mentorias e Consultorias',
        description:
          'Serviços de orientação profissional e aconselhamento especializado.',
      },
      {
        name: 'Workshops e eventos de capacitação',
        description:
          'Participação em eventos educacionais, seminários e workshops.',
      },
    ],
  },
  {
    name: 'Lazer e Entretenimento',
    description:
      'Atividades recreativas, culturais e de entretenimento para momentos de descanso e diversão.',
    type: 'DEBIT',
    color: '#FFC300', // Yellow
    subcategories: [
      {
        name: 'Confraternização',
        description:
          'Eventos sociais com amigos, familiares ou colegas de trabalho.',
      },
      {
        name: 'Cinema',
        description: 'Ingressos e consumo em salas de cinema.',
      },
      {
        name: 'Teatros e Shows',
        description:
          'Ingressos para espetáculos teatrais, musicais e apresentações ao vivo.',
      },
      {
        name: 'Viagens e passeios',
        description:
          'Gastos com turismo, excursões e atividades de lazer fora de casa.',
      },
      {
        name: 'Hobbies e atividades recreativas',
        description:
          'Despesas relacionadas a passatempos e atividades de interesse pessoal.',
      },
      {
        name: 'Streaming',
        description:
          'Assinaturas de serviços de streaming de vídeo, música e conteúdo digital.',
      },
      {
        name: 'Jogos',
        description:
          'Compras de jogos eletrônicos, de tabuleiro ou outras formas de entretenimento interativo.',
      },
      {
        name: 'Assinaturas em geral',
        description:
          'Serviços por assinatura não relacionados a streaming, como revistas e clubes de assinatura.',
      },
    ],
  },
  {
    name: 'Moradia',
    description:
      'Custos relacionados à habitação, manutenção do lar e serviços essenciais domésticos.',
    type: 'DEBIT',
    color: '#DAF7A6', // Light green
    subcategories: [
      {
        name: 'Aluguel',
        description:
          'Pagamento mensal pelo uso de imóvel alugado para moradia.',
      },
      {
        name: 'Condomínio',
        description:
          'Taxas de condomínio para manutenção de áreas comuns em prédios e condomínios.',
      },
      {
        name: 'IPTU',
        description:
          'Imposto Predial e Territorial Urbano cobrado anualmente sobre imóveis.',
      },
      {
        name: 'Reformas',
        description:
          'Gastos com reformas estruturais e melhorias significativas no imóvel.',
      },
      {
        name: 'Manutenção Residencial',
        description:
          'Reparos, consertos e serviços de manutenção regular da residência.',
      },
      {
        name: 'Água',
        description: 'Contas de fornecimento de água e serviços de esgoto.',
      },
      {
        name: 'Energia Elétrica',
        description: 'Faturas de consumo de energia elétrica residencial.',
      },
      {
        name: 'Gás',
        description:
          'Despesas com gás encanado ou botijões para uso doméstico.',
      },
      {
        name: 'Internet e TV',
        description:
          'Serviços de conexão à internet e televisão por assinatura.',
      },
      {
        name: 'Celular',
        description: 'Contas de telefonia móvel e serviços relacionados.',
      },
      {
        name: 'Financiamento Imovel',
        description:
          'Parcelas de financiamento para aquisição de imóvel próprio.',
      },
      {
        name: 'Consórcio Imovel',
        description: 'Contribuições para consórcio visando a compra de imóvel.',
      },
      {
        name: 'Doações',
        description:
          'Contribuições voluntárias para causas sociais e instituições de caridade.',
      },
      {
        name: 'Seguro Residencial',
        description:
          'Pagamentos de apólices de seguro para proteção da residência e seus conteúdos.',
      },
    ],
  },
  {
    name: 'Outros',
    description:
      'Despesas diversas que não se enquadram nas demais categorias ou gastos ocasionais.',
    type: 'DEBIT',
    color: '#C4C4C4', // Gray
    subcategories: [
      {
        name: 'Advogados',
        description:
          'Honorários e custos com serviços jurídicos e advocatícios.',
      },
      {
        name: 'Contadores',
        description: 'Serviços de contabilidade e assessoria fiscal.',
      },
      {
        name: 'Consultores',
        description:
          'Contratação de profissionais para consultoria especializada em diversas áreas.',
      },
      {
        name: 'Outros',
        description:
          'Despesas não classificáveis nas demais subcategorias ou de natureza excepcional.',
      },
    ],
  },
  {
    name: 'Saúde e Bem-Estar',
    description:
      'Gastos relacionados à manutenção da saúde física e mental, tratamentos e cuidados pessoais.',
    type: 'DEBIT',
    color: '#2ECC71', // Green
    subcategories: [
      {
        name: 'Plano de Saúde',
        description:
          'Mensalidades de planos de assistência médica e odontológica.',
      },
      {
        name: 'Farmácia',
        description:
          'Compra de medicamentos, vitaminas e produtos farmacêuticos.',
      },
      {
        name: 'Consultas Médicas',
        description:
          'Pagamentos por consultas com médicos e especialistas da saúde.',
      },
      {
        name: 'Academia e outros',
        description:
          'Mensalidades de academias e outras atividades físicas regulares.',
      },
      {
        name: 'Terapias',
        description:
          'Sessões de terapia, psicologia, fisioterapia e tratamentos alternativos.',
      },
      {
        name: 'Cuidados pessoais e beleza',
        description:
          'Serviços de estética, cabeleireiro e produtos de cuidados pessoais.',
      },
      {
        name: 'Seguro Saúde',
        description:
          'Apólices de seguro saúde complementares ou alternativas ao plano de saúde.',
      },
    ],
  },
  {
    name: 'Transporte',
    description:
      'Custos de locomoção, manutenção de veículos e despesas relacionadas à mobilidade.',
    type: 'DEBIT',
    color: '#3498DB', // Blue
    subcategories: [
      {
        name: 'Combustível',
        description:
          'Abastecimento de veículos com gasolina, etanol, diesel ou outros combustíveis.',
      },
      {
        name: 'Transporte Público',
        description:
          'Passagens de ônibus, metrô, trem e outros meios de transporte coletivo.',
      },
      {
        name: 'Estacionamento',
        description:
          'Taxas de estacionamento em vias públicas, shoppings e estabelecimentos.',
      },
      {
        name: 'Pedágio',
        description: 'Pagamentos de pedágios em rodovias e vias expressas.',
      },
      {
        name: 'Manutenção Veicular',
        description:
          'Serviços de manutenção preventiva e corretiva de veículos.',
      },
      {
        name: 'App de transporte',
        description:
          'Corridas em aplicativos de transporte como Uber, 99 e similares.',
      },
      {
        name: 'IPVA',
        description: 'Imposto sobre a Propriedade de Veículos Automotores.',
      },
      {
        name: 'Multas',
        description: 'Pagamento de multas de trânsito e infrações.',
      },
      {
        name: 'Financiamento Auto',
        description: 'Parcelas de financiamento para aquisição de veículos.',
      },
      {
        name: 'Consórcio Auto',
        description:
          'Contribuições para consórcio visando a compra de veículos.',
      },
      {
        name: 'Seguro Veicular',
        description:
          'Pagamentos de apólices de seguro para proteção de veículos.',
      },
    ],
  },

  // Income categories
  {
    name: 'Investimento',
    description:
      'Rendimentos provenientes de aplicações financeiras e investimentos de capital.',
    type: 'CREDIT',
    color: '#9B59B6', // Purple
    subcategories: [
      {
        name: 'Poupança',
        description:
          'Rendimentos de contas poupança e aplicações de baixo risco.',
      },
      {
        name: 'Previdência Privada',
        description:
          'Resgates e rendimentos de planos de previdência complementar.',
      },
      {
        name: 'Investimentos',
        description:
          'Retornos de investimentos em ações, fundos, títulos e outros ativos financeiros.',
      },
    ],
  },
  {
    name: 'Salário e Rendimentos',
    description:
      'Receitas provenientes de trabalho, benefícios e outras fontes regulares de renda.',
    type: 'CREDIT',
    color: '#1ABC9C', // Turquoise
    subcategories: [
      {
        name: 'Mesada',
        description:
          'Valores recebidos regularmente de familiares para despesas pessoais.',
      },
      {
        name: 'Pensão',
        description: 'Recebimentos de pensão alimentícia ou previdenciária.',
      },
      {
        name: 'Salário',
        description:
          'Remuneração mensal pelo trabalho em regime CLT ou estatutário.',
      },
      {
        name: '13º Salário',
        description:
          'Gratificação natalina paga aos trabalhadores no final do ano.',
      },
      {
        name: 'Rendimento',
        description:
          'Receitas de aluguéis, direitos autorais ou outras fontes passivas.',
      },
      {
        name: 'Renda extra',
        description:
          'Ganhos adicionais de trabalhos temporários, freelance ou comissões.',
      },
    ],
  },
];

async function seedMinimalData() {
  console.log('Starting minimal seed...');

  // Create a single user
  const hashedPassword = await hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: hashedPassword,
      birthDate: new Date('1990-01-01'),
      gender: 'MALE',
      phoneNumber: '554189006487',
    },
  });

  // Create a default account for the user
  await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Cash', // or "General Account"
      description: 'Default account for tracking expenses and income',
      isDefault: true,
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create default categories and subcategories
  for (const category of defaultCategories) {
    // Create parent category
    const parentCategory = await prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
        userId: user.id,
        color: category.color,
      },
    });

    // Create subcategories with specific descriptions
    for (const subcategory of category.subcategories) {
      await prisma.category.create({
        data: {
          name: subcategory.name,
          description: subcategory.description,
          userId: user.id,
          parentId: parentCategory.id,
        },
      });
    }
  }

  console.log(
    `Created ${defaultCategories.length} default categories with subcategories`,
  );

  console.log('Minimal seed completed successfully!');
}

async function main() {
  try {
    await seedMinimalData();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
