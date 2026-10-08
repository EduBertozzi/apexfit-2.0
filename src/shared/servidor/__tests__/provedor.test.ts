import { CODIGO_SEM_IA } from '@/shared/lib/semIa';

import { ollamaDisponivel } from '../ollama';
import { erroSemIa, escolherProvedor } from '../provedor';

jest.mock('../ollama', () => ({ ollamaDisponivel: jest.fn(async () => false) }));

const AMBIENTE = { ...process.env };

beforeEach(() => {
  process.env = { ...AMBIENTE };
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  jest.mocked(ollamaDisponivel).mockResolvedValue(false);
});

afterAll(() => {
  process.env = AMBIENTE;
});

describe('escolherProvedor', () => {
  it('Claude vem primeiro quando há chave', async () => {
    process.env.ANTHROPIC_API_KEY = 'a';
    process.env.OPENAI_API_KEY = 'b';

    expect(await escolherProvedor()).toBe('claude');
  });

  it('depois OpenAI, sem nem perguntar ao Ollama', async () => {
    process.env.OPENAI_API_KEY = 'b';

    expect(await escolherProvedor()).toBe('openai');
    expect(ollamaDisponivel).not.toHaveBeenCalled();
  });

  it('sem chaves, usa a IA local se estiver ligada', async () => {
    jest.mocked(ollamaDisponivel).mockResolvedValue(true);

    expect(await escolherProvedor()).toBe('local');
  });

  it('sem nada, nenhum (modo demonstração no app)', async () => {
    expect(await escolherProvedor()).toBe('nenhum');
    expect(erroSemIa().codigo).toBe(CODIGO_SEM_IA);
  });
});
