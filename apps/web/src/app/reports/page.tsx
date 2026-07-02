export default function ReportsPage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Relatórios</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium text-slate-900">SGQ</h2>
          <p className="text-sm text-slate-500">Auditorias, não conformidades e ações corretivas.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium text-slate-900">SGSO</h2>
          <p className="text-sm text-slate-500">Perigos, riscos, ocorrências e IDSO.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium text-slate-900">Acadêmico</h2>
          <p className="text-sm text-slate-500">Matrículas, exames e certificados emitidos.</p>
        </div>
      </div>
    </main>
  );
}
