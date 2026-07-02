/** Status genérico de vencimento usado por qualificações, CMA, contratos etc. */
export enum ExpiryStatus {
  EM_DIA = 'em_dia',
  A_VENCER = 'a_vencer',
  VENCIDO = 'vencido',
}

/** Status de aprovação de documentos regulatórios. */
export enum DocumentApprovalStatus {
  EM_ELABORACAO = 'em_elaboracao',
  SUBMETIDO_ANAC = 'submetido_anac',
  APROVADO = 'aprovado',
  EM_REVISAO = 'em_revisao',
  EMENDADO = 'emendado',
}

/** Status de matrícula acadêmica. */
export enum EnrollmentStatus {
  ATIVA = 'ativa',
  CONCLUIDA = 'concluida',
  TRANCADA = 'trancada',
  CANCELADA = 'cancelada',
  EXPIRADA = 'expirada',
}

/** Status de curso. */
export enum CourseStatus {
  ATIVO = 'ativo',
  ALERTA_INATIVIDADE = 'alerta_inatividade',
  SUSPENSO = 'suspenso',
  ENCERRADO = 'encerrado',
}

/** Tipo de exame acadêmico. */
export enum ExamType {
  TEORICO = 'teorico',
  PRATICO = 'pratico',
}

/** Resultado de exame. */
export enum ExamResult {
  APROVADO = 'aprovado',
  REPROVADO = 'reprovado',
  PENDENTE = 'pendente',
}
