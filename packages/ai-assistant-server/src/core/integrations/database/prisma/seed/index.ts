const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  {
    name: 'Alimentação',
    description: 'Despesas com alimentação e supermercado.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Utilidades',
    description: 'Contas mensais de utilidades como água, luz e gás.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Saúde',
    description:
      'Gastos com saúde, incluindo medicamentos e consultas médicas.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Transporte',
    description: 'Despesas relacionadas ao transporte pessoal e público.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Lazer',
    description: 'Gastos com atividades de lazer e entretenimento.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Educação',
    description: 'Investimentos em educação, como escola, cursos e livros.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Roupas',
    description: 'Compras de vestuário e acessórios.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Moradia',
    description: 'Gastos com aluguel ou manutenção de residência.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Investimentos',
    description: 'Aportes em investimentos financeiros.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Poupança',
    description: 'Contribuições para poupança ou reserva de emergência.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Presentes',
    description: 'Despesas com presentes para amigos e familiares.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Doações',
    description: 'Contribuições para caridade ou doações.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Beleza',
    description: 'Gastos com salões de beleza e produtos estéticos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Fitness',
    description: 'Despesas com atividades físicas e academia.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Pet',
    description: 'Despesas relacionadas a animais de estimação.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Viagens',
    description: 'Gastos com viagens e férias.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Reformas',
    description: 'Despesas com melhorias e manutenções no lar.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Tecnologia',
    description:
      'Gastos com dispositivos eletrônicos e serviços de tecnologia.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Serviços Profissionais',
    description:
      'Pagamentos por serviços de profissionais como advogados, contadores e consultores.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Seguros',
    description: 'Pagamentos mensais ou anuais para seguros diversos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Hobbies',
    description: 'Gastos com passatempos e atividades recreativas.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Restaurante',
    description: 'Despesas em restaurantes, bares e lanchonetes.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Salario',
    description: 'Recebimento de salário mensal.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Rendimento',
    description: 'Rendimentos de investimentos e outras fontes.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Impostos',
    description: 'Pagamentos de impostos e taxas.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Financiamento',
    description: 'Pagamentos de financiamentos e empréstimos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Outros',
    description: 'Despesas diversas não categorizadas.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'IPTU',
    description: 'Imposto Predial e Territorial Urbano.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'IPVA',
    description: 'Imposto sobre a Propriedade de Veículos Automotores.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Condomínio',
    description: 'Taxa mensal de condomínio.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Plano de Saúde',
    description: 'Mensalidade do plano de saúde.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: '13º Salário',
    description: 'Recebimento do décimo terceiro salário.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Vale Refeição',
    description: 'Benefício de alimentação.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Vale Transporte',
    description: 'Benefício de transporte.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'FGTS',
    description: 'Fundo de Garantia do Tempo de Serviço.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'INSS',
    description: 'Contribuição para a Previdência Social.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'IR',
    description: 'Imposto de Renda.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Férias',
    description: 'Recebimento de férias.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'PLR',
    description: 'Participação nos Lucros e Resultados.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Internet e TV',
    description: 'Serviços de internet e TV por assinatura.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Celular',
    description: 'Plano de telefonia móvel.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Cartão de Crédito',
    description: 'Fatura do cartão de crédito.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Consórcio',
    description: 'Pagamento de parcelas de consórcio.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Previdência Privada',
    description: 'Contribuição para previdência privada.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Material Escolar',
    description: 'Gastos com material escolar.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Farmácia',
    description: 'Gastos com medicamentos e produtos farmacêuticos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Combustível',
    description: 'Gastos com combustível para veículos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Empréstimo',
    description: 'Empréstimos bancários e financiamentos pessoais.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Multas',
    description: 'Multas de trânsito e outras penalidades.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Estacionamento',
    description: 'Gastos com estacionamento de veículos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Pedágio',
    description: 'Gastos com pedágios em rodovias.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Manutenção Veicular',
    description: 'Manutenção e reparos de veículos.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Escola/Faculdade',
    description: 'Mensalidades escolares ou universitárias.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Streaming',
    description: 'Serviços de streaming como Netflix, Spotify, etc.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Jogos',
    description: 'Gastos com jogos e apostas (incluindo loteria).',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Vestuário Profissional',
    description: 'Roupas e acessórios para trabalho.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Mesada',
    description: 'Mesada para filhos ou dependentes.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Pensão',
    description: 'Pagamento ou recebimento de pensão.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
  {
    name: 'Aluguel de Temporada',
    description: 'Gastos com aluguel de imóveis para temporada.',
    currency: 'BRL',
    currencySymbol: 'R$',
  },
];

const user = {
  firstName: 'Matheus',
  lastName: 'Benites',
  phone: '5541989006487',
  email: 'matheus.benites@example.com',
  lastInteraction: new Date(),
  offersAcceptance: true,
  confirmationCode: '123456',
  confirmationCodeExpirationDate: new Date(
    new Date().setDate(new Date().getDate() + 7),
  ),
  confirmedAt: new Date(),
};

async function main() {
  console.log(`Start seeding ...`);

  // Create categories
  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: category,
    });
    console.log(`Created category: ${createdCategory.name}`);
  }

  // Create user
  const createdUser = await prisma.user.create({
    data: user,
  });
  console.log(`Created user: ${createdUser.firstName} ${createdUser.lastName}`);

  // // Get all categories
  // const allCategories = await prisma.category.findMany();

  // // Define transaction type
  // type Transaction = {
  //   amount: number;
  //   description: string;
  //   date: Date;
  //   userId: number;
  //   categoryId: number;
  //   transactionType: 'INCOME' | 'EXPENSE';
  // };

  // // Create transactions
  // const transactions: Transaction[] = [];
  // for (let i = 0; i < 25; i++) {
  //   const randomCategory =
  //     allCategories[Math.floor(Math.random() * allCategories.length)];
  //   const randomAmount = (Math.random() * 1000).toFixed(2);
  //   const randomDate = new Date(
  //     new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 60)),
  //   );

  //   const transactionType = Math.random() > 0.5 ? 'INCOME' : 'EXPENSE';

  //   let categoryName = randomCategory.name;
  //   if (transactionType === 'INCOME') {
  //     const incomeCategories = ['Salario', 'Rendimento'];
  //     categoryName =
  //       incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
  //   }

  //   const transaction: Transaction = {
  //     amount: parseFloat(randomAmount),
  //     description: `Transaction for ${categoryName}`,
  //     date: randomDate,
  //     userId: createdUser.id,
  //     categoryId: allCategories.find(
  //       (category) => category.name === categoryName,
  //     )?.id,
  //     transactionType: transactionType,
  //   };

  //   transactions.push(transaction);
  // }

  // for (const transaction of transactions) {
  //   const createdTransaction = await prisma.transaction.create({
  //     data: transaction,
  //   });
  //   console.log(`Created transaction: ${createdTransaction.description}`);
  // }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
