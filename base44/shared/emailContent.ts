// emailContent.ts — funções compartilhadas para conteúdo de e-mail (Gmail e Outlook).

export function formatEmailBody(profile, job) {
  const nome = profile?.nome_completo || "Candidato(a)";
  const cargo = job?.cargo || "a vaga";
  const curso = profile?.curso || "Ensino Superior";
  return (
    "Prezados,\n\n" +
    "Gostaria de apresentar minha candidatura a oportunidade de " + cargo + ".\n" +
    "Sou estudante de " + curso + " e tenho interesse em contribuir com a equipe.\n" +
    "Encaminho meu curriculo para avaliacao.\n\n" +
    "Atenciosamente,\n" + nome
  );
}

export function formatEmailSubject(job, profile) {
  const cargo = job?.cargo || "Vaga";
  const nome = profile?.nome_completo || "Candidato(a)";
  return "Candidatura para " + cargo + " - " + nome;
}

export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}