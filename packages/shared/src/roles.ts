/**
 * Perfis de acesso (RBAC) reconhecidos em todo o monorepo.
 *
 * Regra de negócio: o perfil GERENTE_QUALIDADE nunca pode ser combinado
 * com nenhum outro perfil no mesmo UserProfile (ver auth module).
 */
export enum Role {
  ADMIN = 'ADMIN',
  GERENTE_QUALIDADE = 'GERENTE_QUALIDADE',
  GERENTE_SEGURANCA = 'GERENTE_SEGURANCA',
  COORDENADOR_ACADEMICO = 'COORDENADOR_ACADEMICO',
  INSTRUTOR = 'INSTRUTOR',
  EXAMINADOR = 'EXAMINADOR',
  SECRETARIA_ACADEMICA = 'SECRETARIA_ACADEMICA',
  COMERCIAL = 'COMERCIAL',
  FINANCEIRO = 'FINANCEIRO',
  ALUNO = 'ALUNO',
}

export const EXCLUSIVE_ROLES: Role[] = [Role.GERENTE_QUALIDADE];
