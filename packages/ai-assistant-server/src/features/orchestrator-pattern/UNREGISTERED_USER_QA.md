# Cenários de Teste QA para Usuários Não Registrados

## 1. Conversa Inicial (Sem Registro)
| ID do Teste | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------------------|--------------|
| 1.1 | "Olá" | Encaminha para general_assistant_worker | Saudação simples não deve acionar registro |
| 1.2 | "Oi Tamy" | Encaminha para general_assistant_worker | Saudação com nome não deve acionar registro |
| 1.3 | "Olá, tudo bem?" | Encaminha para general_assistant_worker | Saudação em português deve ser tratada apropriadamente |
| 1.4 | "O que é um fundo mútuo?" | Encaminha para financial_coach_worker | Pergunta financeira deve ir para o coach financeiro |
| 1.5 | "Como economizar dinheiro?" | Encaminha para financial_coach_worker | Pergunta financeira em português |
| 1.6 | "Me conta uma piada" | Encaminha para general_assistant_worker | Conversa casual deve ficar no assistente geral |
| 1.7 | "Como está o tempo hoje?" | Encaminha para general_assistant_worker | Pergunta não financeira |

## 2. Solicitações Explícitas de Registro
| ID do Teste | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------------------|--------------|
| 2.1 | "Quero criar uma conta" | Encaminha para registration_worker | Solicitação explícita de registro em português |
| 2.2 | "Como faço para me registrar?" | Encaminha para registration_worker | Pergunta sobre processo de registro |
| 2.3 | "Quero me cadastrar" | Encaminha para registration_worker | Registro explícito em português |
| 2.4 | "Me cadastra por favor" | Encaminha para registration_worker | Fraseologia alternativa de registro |
| 2.5 | "Posso entrar na Tamy?" | Encaminha para registration_worker | Solicitação indireta de registro |
| 2.6 | "Gostaria de criar uma conta" | Encaminha para registration_worker | Solicitação educada de registro em português |
| 2.7 | "Preciso de uma conta para acompanhar minhas finanças" | Encaminha para registration_worker | Registro com contexto |

## 3. Respostas do Fluxo de Registro
| ID do Teste | Contexto | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------|----------------------|--------------|
| 3.1 | Após início do registro (coleta_nome) | "João Silva" | Continua em registration_worker, move para etapa de email | Entrada de nome válido |
| 3.2 | Após início do registro (coleta_nome) | "J" | Permanece em registration_worker, solicita nome válido | Tratamento de nome inválido |
| 3.3 | Etapa de coleta de email | "joao@exemplo.com" | Continua em registration_worker | Email válido |
| 3.4 | Etapa de coleta de email | "não é um email" | Permanece em registration_worker, solicita email válido | Tratamento de email inválido |
| 3.5 | Etapa de confirmação | "Sim, está correto" | Completa fluxo de registro | Confirmação positiva |
| 3.6 | Etapa de confirmação | "Não, meu email está errado" | Retorna à coleta de email | Tratamento de correção |

## 4. Tentativas de Sair do Registro
| ID do Teste | Contexto | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------|----------------------|--------------|
| 4.1 | Durante coleta de nome | "Na verdade, não quero me registrar agora" | LLM deve reconhecer intenção de saída, encaminhar para general_assistant | Solicitação explícita de saída |
| 4.2 | Durante coleta de email | "Cancelar cadastro" | LLM deve reconhecer intenção de saída, encaminhar para general_assistant | Cancelamento direto |
| 4.3 | Durante coleta de email | "Como está o tempo hoje?" | Deve permanecer em registration_worker a menos que LLM identifique forte mudança de tópico | Tentativa implícita de saída |
| 4.4 | Durante coleta de email | "Quero parar o cadastro" | LLM deve reconhecer intenção de saída em português | Saída em português |
| 4.5 | Durante coleta de email | "Parar" | LLM deve reconhecer intenção mínima de saída | Saída com palavra única |
| 4.6 | Durante confirmação | "Na verdade quero falar sobre investimentos" | LLM deve reconhecer saída com novo tópico | Saída com mudança de tópico |

## 5. Cenários Mistos
| ID do Teste | Contexto | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------|----------------------|--------------|
| 5.1 | Após discussão sobre finanças | "Agora quero me registrar" | Deve transicionar para registration_worker | Mudança de contexto para registro |
| 5.2 | Durante conversa geral | "Como salvo meus dados financeiros aqui?" | Pode acionar explicação sobre registro | Consulta indireta sobre registro |
| 5.3 | Após tentativa falha de registro | "Vamos tentar registrar novamente" | Deve reiniciar fluxo de registro | Tentativa de registro novamente |
| 5.4 | Após saída do registro | "Quais serviços financeiros vocês oferecem?" | Deve ir para financial_coach_worker | Pergunta financeira após saída |
| 5.5 | Primeira mensagem, pergunta longa | "Estou tentando economizar para aposentadoria mas não sei por onde começar. Tenho 35 anos e cerca de R$50 mil guardados até agora. O que devo fazer?" | Deve encaminhar para financial_coach_worker não para registro | Consulta financeira complexa |
| 5.6 | Múltiplas perguntas | "Olá! Pode me ajudar a entender ETFs? Ah, e como faço para me cadastrar?" | Provavelmente encaminha para registration_worker já que contém intenção de registro | Detecção de intenção mista |

## 6. Casos de Borda
| ID do Teste | Contexto | Mensagem | Comportamento Esperado | Observações |
|-------------|----------|----------|----------------------|--------------|
| 6.1 | Usuário novo | "?" | Encaminha para general_assistant_worker | Tratamento de entrada mínima |
| 6.2 | Usuário novo | "123456" | Encaminha para general_assistant_worker | Entrada apenas numérica |
| 6.3 | Usuário novo | "..." | Encaminha para general_assistant_worker | Entrada apenas com pontuação |
| 6.4 | Usuário novo | "cadastro registro conta inscrever" | LLM deve detectar intenção de registro mesmo sendo apenas palavras-chave | Palavras-chave sem gramática |
| 6.5 | Durante etapa de email | "este é meu email: usuario@exemplo.com e meu telefone é 555-1234" | Deve extrair email e continuar registro | Compartilhamento excessivo de informação |
| 6.6 | Usuário novo | História muito longa sobre finanças pessoais (300+ palavras) | Deve analisar conteúdo e encaminhar apropriadamente | Tratamento de mensagem longa |

## 7. Testes de Conversas Multi-turnos
| Sequência de Teste | Mensagens | Comportamento Esperado | Observações |
|-------------------|-----------|----------------------|--------------|
| 7.1 | 1. "Olá"<br>2. "O que é a Tamy?"<br>3. "Como faço para me cadastrar?" | 1-2. general_assistant_worker<br>3. registration_worker | Progressão natural para registro |
| 7.2 | 1. "Quero me registrar"<br>2. "João Silva"<br>3. "Na verdade, cancela"<br>4. "Me fala sobre investimentos" | 1-2. registration_worker<br>3. Saída detectada<br>4. financial_coach_worker | Início de registro, depois cancela |
| 7.3 | 1. "Olá"<br>2. "Qual é uma boa taxa de poupança?"<br>3. "Posso acompanhar minhas economias aqui?"<br>4. "Sim, quero me cadastrar" | 1. general_assistant_worker<br>2. financial_coach_worker<br>3. Provavelmente financial_coach_worker<br>4. registration_worker | Progressão natural através de diferentes workers |
