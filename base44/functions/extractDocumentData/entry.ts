import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ownedRecord } from '../../shared/personalOwnership.ts';

const TIPOS = {
  ctps: {
    prompt:
      "Você é um assistente que extrai informações de CTPS (Carteira de Trabalho e Previdência Social) em PDF. " +
      "Extraia APENAS os dados visíveis no documento sobre vínculos empregatícios. " +
      "Para cada vínculo empregatício, identifique: empresa, cargo, data de admissão e data de saída. " +
      "REGRAS OBRIGATÓRIAS: Nunca inclua CPF, PIS, números de documentos, salários ou qualquer dado pessoal. " +
      "Se um campo não estiver visível no documento, use exatamente 'Não identificado'. " +
      "Não invente datas, cargos ou empresas que não estejam no documento. " +
      "Retorne uma lista de experiências (pode ser vazia se nenhuma for encontrada).",
    schema: {
      type: "object",
      properties: {
        experiencias: {
          type: "array",
          items: {
            type: "object",
            properties: {
              empresa: { type: "string" },
              cargo: { type: "string" },
              data_admissao: { type: "string" },
              data_saida: { type: "string" },
            },
          },
        },
      },
    },
  },
  certificado: {
    prompt:
      "Você é um assistente que extrai informações de certificados e comprovantes de cursos em PDF. " +
      "Extraia APENAS os dados visíveis: nome do curso, instituição emissora, data de conclusão e carga horária (se presente). " +
      "REGRAS OBRIGATÓRIAS: Nunca inclua CPF, RG, números de documentos, salários ou qualquer dado pessoal. " +
      "Se um campo não estiver visível no documento, use exatamente 'Não identificado'. " +
      "Não invente datas ou informações que não estejam no documento. " +
      "Não inclua nomes de pessoas, apenas dados do curso.",
    schema: {
      type: "object",
      properties: {
        nome_curso: { type: "string" },
        instituicao: { type: "string" },
        data_conclusao: { type: "string" },
        carga_horaria: { type: "string" },
      },
    },
  },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.document_id || Object.keys(body).some(key => key !== 'document_id')) return Response.json({ error: 'Informe apenas document_id.' }, { status: 400 });
    const doc = await ownedRecord(base44, 'CandidateDocument', body.document_id, user.id);
    const config = TIPOS[doc.tipo_documento];
    if (!config) {
      return Response.json({ error: "tipo_documento deve ser 'ctps' ou 'certificado'" }, { status: 400 });
    }

    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.referencia_arquivo_privado });
    await base44.asServiceRole.entities.CandidateDocument.update(doc.id, { status_extracao: 'processando' });
    try {
      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: config.prompt, file_urls: [signed_url], response_json_schema: config.schema });
      await base44.asServiceRole.entities.CandidateDocument.update(doc.id, { status_extracao: 'concluido', dados_extraidos: result });
      return Response.json({ extracted: result });
    } catch (error) {
      await base44.asServiceRole.entities.CandidateDocument.update(doc.id, { status_extracao: 'erro' });
      throw error;
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}