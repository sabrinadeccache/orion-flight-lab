'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSupabase } from '../../../../components/providers/supabase-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Named {
  id: string;
  name: string;
  order: number;
}
interface LessonT extends Named {
  duration_hours: string;
}
interface MaterialT {
  id: string;
  name: string;
  type: 'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO';
  file_url: string | null;
  content_html: string | null;
}
interface QuizQuestionT {
  id: string;
  prompt: string;
  options: { id: string; text: string; is_correct: boolean }[];
}
interface QuizT {
  id: string;
  title: string;
  questions: QuizQuestionT[];
}

export function ContentManager({ courseId }: { courseId: string }): React.ReactElement {
  const { session } = useSupabase();
  const token = session?.access_token;

  const [segments, setSegments] = useState<Named[] | null>(null);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [modulesBySegment, setModulesBySegment] = useState<Record<string, Named[]>>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [unitsByModule, setUnitsByModule] = useState<Record<string, Named[]>>({});
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [subUnitsByUnit, setSubUnitsByUnit] = useState<Record<string, Named[]>>({});
  const [expandedSubUnit, setExpandedSubUnit] = useState<string | null>(null);
  const [lessonsBySubUnit, setLessonsBySubUnit] = useState<Record<string, LessonT[]>>({});
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [materialsByLesson, setMaterialsByLesson] = useState<Record<string, MaterialT[]>>({});
  const [quizByLesson, setQuizByLesson] = useState<Record<string, QuizT | null>>({});
  const [error, setError] = useState<string | null>(null);

  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingSubUnit, setEditingSubUnit] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);

  async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  }

  async function loadJson<T>(path: string): Promise<T | null> {
    const response = await authedFetch(path);
    if (!response.ok) return null;
    const body = await response.json();
    return body.data as T;
  }

  useEffect(() => {
    loadJson<Named[]>(`/training/courses/${courseId}/segments`).then((data) => setSegments(data ?? []));
  }, [courseId]);

  async function handleCreate(
    path: string,
    body: Record<string, unknown>,
    onSuccess: () => Promise<void> | void,
  ): Promise<void> {
    setError(null);
    const response = await authedFetch(path, { method: 'POST', body: JSON.stringify(body) });
    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      setError(responseBody?.errors?.[0]?.message ?? 'Não foi possível salvar.');
      return;
    }
    await onSuccess();
  }

  async function handleUpdate(
    path: string,
    body: Record<string, unknown>,
    onSuccess: () => Promise<void> | void,
  ): Promise<void> {
    setError(null);
    const response = await authedFetch(path, { method: 'PATCH', body: JSON.stringify(body) });
    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      setError(responseBody?.errors?.[0]?.message ?? 'Não foi possível salvar.');
      return;
    }
    await onSuccess();
  }

  async function handleDelete(path: string, onSuccess: () => Promise<void> | void): Promise<void> {
    if (!confirm('Excluir este item? Essa ação não pode ser desfeita.')) return;
    const response = await authedFetch(path, { method: 'DELETE' });
    if (!response.ok) {
      setError('Não foi possível excluir.');
      return;
    }
    await onSuccess();
  }

  async function toggleSegment(id: string): Promise<void> {
    if (expandedSegment === id) {
      setExpandedSegment(null);
      return;
    }
    setExpandedSegment(id);
    if (!modulesBySegment[id]) {
      const data = (await loadJson<Named[]>(`/training/segments/${id}/modules`)) ?? [];
      setModulesBySegment((prev) => ({ ...prev, [id]: data }));
    }
  }

  async function toggleModule(id: string): Promise<void> {
    if (expandedModule === id) {
      setExpandedModule(null);
      return;
    }
    setExpandedModule(id);
    if (!unitsByModule[id]) {
      const data = (await loadJson<Named[]>(`/training/modules/${id}/units`)) ?? [];
      setUnitsByModule((prev) => ({ ...prev, [id]: data }));
    }
  }

  async function toggleUnit(id: string): Promise<void> {
    if (expandedUnit === id) {
      setExpandedUnit(null);
      return;
    }
    setExpandedUnit(id);
    if (!subUnitsByUnit[id]) {
      const data = (await loadJson<Named[]>(`/training/units/${id}/sub-units`)) ?? [];
      setSubUnitsByUnit((prev) => ({ ...prev, [id]: data }));
    }
  }

  async function toggleSubUnit(id: string): Promise<void> {
    if (expandedSubUnit === id) {
      setExpandedSubUnit(null);
      return;
    }
    setExpandedSubUnit(id);
    if (!lessonsBySubUnit[id]) {
      const data = (await loadJson<LessonT[]>(`/training/sub-units/${id}/lessons`)) ?? [];
      setLessonsBySubUnit((prev) => ({ ...prev, [id]: data }));
    }
  }

  async function toggleLesson(id: string): Promise<void> {
    if (expandedLesson === id) {
      setExpandedLesson(null);
      return;
    }
    setExpandedLesson(id);
    if (!materialsByLesson[id]) {
      const data = (await loadJson<MaterialT[]>(`/training/lessons/${id}/materials`)) ?? [];
      setMaterialsByLesson((prev) => ({ ...prev, [id]: data }));
    }
    if (quizByLesson[id] === undefined) {
      const quiz = await loadJson<QuizT | null>(`/lms/lessons/${id}/quiz`);
      setQuizByLesson((prev) => ({ ...prev, [id]: quiz }));
    }
  }

  async function handleUploadMaterialFile(materialId: string, lessonId: string, file: File): Promise<void> {
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    const response = await authedFetch(`/training/materials/${materialId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      setError('Não foi possível enviar o arquivo.');
      return;
    }
    const data = (await loadJson<MaterialT[]>(`/training/lessons/${lessonId}/materials`)) ?? [];
    setMaterialsByLesson((prev) => ({ ...prev, [lessonId]: data }));
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <AddForm
        placeholder="Nome do segmento"
        onSubmit={(name, order) =>
          handleCreate('/training/segments', { course_id: courseId, name, order }, async () => {
            const data = (await loadJson<Named[]>(`/training/courses/${courseId}/segments`)) ?? [];
            setSegments(data);
          })
        }
      />

      <div className="space-y-2">
        {(segments ?? []).map((segment) => (
          <div key={segment.id} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              {editingSegment === segment.id ? (
                <EditForm
                  initialName={segment.name}
                  initialOrder={segment.order}
                  onSubmit={(name, order) =>
                    handleUpdate(`/training/segments/${segment.id}`, { name, order }, async () => {
                      const data = (await loadJson<Named[]>(`/training/courses/${courseId}/segments`)) ?? [];
                      setSegments(data);
                      setEditingSegment(null);
                    })
                  }
                  onCancel={() => setEditingSegment(null)}
                />
              ) : (
                <>
                  <button
                    onClick={() => toggleSegment(segment.id)}
                    className="text-left font-medium text-slate-900 hover:underline"
                  >
                    {expandedSegment === segment.id ? '▾' : '▸'} {segment.name}
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingSegment(segment.id)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(`/training/segments/${segment.id}`, async () => {
                          const data = (await loadJson<Named[]>(`/training/courses/${courseId}/segments`)) ?? [];
                          setSegments(data);
                        })
                      }
                      className="text-xs text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>

            {expandedSegment === segment.id && (
              <div className="border-t border-slate-100 px-4 py-3 pl-8">
                <AddForm
                  placeholder="Nome do módulo"
                  onSubmit={(name, order) =>
                    handleCreate('/training/modules', { segment_id: segment.id, name, order }, async () => {
                      const data = (await loadJson<Named[]>(`/training/segments/${segment.id}/modules`)) ?? [];
                      setModulesBySegment((prev) => ({ ...prev, [segment.id]: data }));
                    })
                  }
                />
                <div className="mt-2 space-y-2">
                  {(modulesBySegment[segment.id] ?? []).map((moduleItem) => (
                    <div key={moduleItem.id} className="rounded-md border border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-between px-3 py-2">
                        {editingModule === moduleItem.id ? (
                          <EditForm
                            initialName={moduleItem.name}
                            initialOrder={moduleItem.order}
                            onSubmit={(name, order) =>
                              handleUpdate(`/training/modules/${moduleItem.id}`, { name, order }, async () => {
                                const data =
                                  (await loadJson<Named[]>(`/training/segments/${segment.id}/modules`)) ?? [];
                                setModulesBySegment((prev) => ({ ...prev, [segment.id]: data }));
                                setEditingModule(null);
                              })
                            }
                            onCancel={() => setEditingModule(null)}
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => toggleModule(moduleItem.id)}
                              className="text-left text-sm font-medium text-slate-800 hover:underline"
                            >
                              {expandedModule === moduleItem.id ? '▾' : '▸'} {moduleItem.name}
                            </button>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setEditingModule(moduleItem.id)}
                                className="text-xs text-slate-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(`/training/modules/${moduleItem.id}`, async () => {
                                    const data =
                                      (await loadJson<Named[]>(`/training/segments/${segment.id}/modules`)) ?? [];
                                    setModulesBySegment((prev) => ({ ...prev, [segment.id]: data }));
                                  })
                                }
                                className="text-xs text-red-600 hover:underline"
                              >
                                Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {expandedModule === moduleItem.id && (
                        <div className="border-t border-slate-200 px-3 py-2 pl-6">
                          <AddForm
                            placeholder="Nome da unidade"
                            onSubmit={(name, order) =>
                              handleCreate('/training/units', { module_id: moduleItem.id, name, order }, async () => {
                                const data =
                                  (await loadJson<Named[]>(`/training/modules/${moduleItem.id}/units`)) ?? [];
                                setUnitsByModule((prev) => ({ ...prev, [moduleItem.id]: data }));
                              })
                            }
                          />
                          <div className="mt-2 space-y-2">
                            {(unitsByModule[moduleItem.id] ?? []).map((unit) => (
                              <div key={unit.id} className="rounded-md border border-slate-200 bg-white">
                                <div className="flex items-center justify-between px-3 py-2">
                                  {editingUnit === unit.id ? (
                                    <EditForm
                                      initialName={unit.name}
                                      initialOrder={unit.order}
                                      onSubmit={(name, order) =>
                                        handleUpdate(`/training/units/${unit.id}`, { name, order }, async () => {
                                          const data =
                                            (await loadJson<Named[]>(`/training/modules/${moduleItem.id}/units`)) ??
                                            [];
                                          setUnitsByModule((prev) => ({ ...prev, [moduleItem.id]: data }));
                                          setEditingUnit(null);
                                        })
                                      }
                                      onCancel={() => setEditingUnit(null)}
                                    />
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => toggleUnit(unit.id)}
                                        className="text-left text-sm font-medium text-slate-800 hover:underline"
                                      >
                                        {expandedUnit === unit.id ? '▾' : '▸'} {unit.name}
                                      </button>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => setEditingUnit(unit.id)}
                                          className="text-xs text-slate-600 hover:underline"
                                        >
                                          Editar
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(`/training/units/${unit.id}`, async () => {
                                              const data =
                                                (await loadJson<Named[]>(
                                                  `/training/modules/${moduleItem.id}/units`,
                                                )) ?? [];
                                              setUnitsByModule((prev) => ({ ...prev, [moduleItem.id]: data }));
                                            })
                                          }
                                          className="text-xs text-red-600 hover:underline"
                                        >
                                          Excluir
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {expandedUnit === unit.id && (
                                  <div className="border-t border-slate-100 px-3 py-2 pl-6">
                                    <AddForm
                                      placeholder="Nome da subunidade"
                                      onSubmit={(name, order) =>
                                        handleCreate(
                                          '/training/sub-units',
                                          { unit_id: unit.id, name, order },
                                          async () => {
                                            const data =
                                              (await loadJson<Named[]>(`/training/units/${unit.id}/sub-units`)) ?? [];
                                            setSubUnitsByUnit((prev) => ({ ...prev, [unit.id]: data }));
                                          },
                                        )
                                      }
                                    />
                                    <div className="mt-2 space-y-2">
                                      {(subUnitsByUnit[unit.id] ?? []).map((subUnit) => (
                                        <div key={subUnit.id} className="rounded-md border border-slate-200">
                                          <div className="flex items-center justify-between px-3 py-2">
                                            {editingSubUnit === subUnit.id ? (
                                              <EditForm
                                                initialName={subUnit.name}
                                                initialOrder={subUnit.order}
                                                onSubmit={(name, order) =>
                                                  handleUpdate(
                                                    `/training/sub-units/${subUnit.id}`,
                                                    { name, order },
                                                    async () => {
                                                      const data =
                                                        (await loadJson<Named[]>(
                                                          `/training/units/${unit.id}/sub-units`,
                                                        )) ?? [];
                                                      setSubUnitsByUnit((prev) => ({ ...prev, [unit.id]: data }));
                                                      setEditingSubUnit(null);
                                                    },
                                                  )
                                                }
                                                onCancel={() => setEditingSubUnit(null)}
                                              />
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => toggleSubUnit(subUnit.id)}
                                                  className="text-left text-sm font-medium text-slate-800 hover:underline"
                                                >
                                                  {expandedSubUnit === subUnit.id ? '▾' : '▸'} {subUnit.name}
                                                </button>
                                                <div className="flex items-center gap-3">
                                                  <button
                                                    onClick={() => setEditingSubUnit(subUnit.id)}
                                                    className="text-xs text-slate-600 hover:underline"
                                                  >
                                                    Editar
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleDelete(`/training/sub-units/${subUnit.id}`, async () => {
                                                        const data =
                                                          (await loadJson<Named[]>(
                                                            `/training/units/${unit.id}/sub-units`,
                                                          )) ?? [];
                                                        setSubUnitsByUnit((prev) => ({ ...prev, [unit.id]: data }));
                                                      })
                                                    }
                                                    className="text-xs text-red-600 hover:underline"
                                                  >
                                                    Excluir
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>

                                          {expandedSubUnit === subUnit.id && (
                                            <div className="border-t border-slate-100 px-3 py-2 pl-6">
                                              <LessonForm
                                                onSubmit={(name, order, durationHours) =>
                                                  handleCreate(
                                                    '/training/lessons',
                                                    {
                                                      sub_unit_id: subUnit.id,
                                                      name,
                                                      order,
                                                      duration_hours: durationHours,
                                                    },
                                                    async () => {
                                                      const data =
                                                        (await loadJson<LessonT[]>(
                                                          `/training/sub-units/${subUnit.id}/lessons`,
                                                        )) ?? [];
                                                      setLessonsBySubUnit((prev) => ({
                                                        ...prev,
                                                        [subUnit.id]: data,
                                                      }));
                                                    },
                                                  )
                                                }
                                              />
                                              <div className="mt-2 space-y-2">
                                                {(lessonsBySubUnit[subUnit.id] ?? []).map((lesson) => (
                                                  <div key={lesson.id} className="rounded-md border border-slate-200">
                                                    <div className="flex items-center justify-between px-3 py-2">
                                                      {editingLesson === lesson.id ? (
                                                        <LessonEditForm
                                                          initialName={lesson.name}
                                                          initialOrder={lesson.order}
                                                          initialDuration={Number(lesson.duration_hours)}
                                                          onSubmit={(name, order, durationHours) =>
                                                            handleUpdate(
                                                              `/training/lessons/${lesson.id}`,
                                                              { name, order, duration_hours: durationHours },
                                                              async () => {
                                                                const data =
                                                                  (await loadJson<LessonT[]>(
                                                                    `/training/sub-units/${subUnit.id}/lessons`,
                                                                  )) ?? [];
                                                                setLessonsBySubUnit((prev) => ({
                                                                  ...prev,
                                                                  [subUnit.id]: data,
                                                                }));
                                                                setEditingLesson(null);
                                                              },
                                                            )
                                                          }
                                                          onCancel={() => setEditingLesson(null)}
                                                        />
                                                      ) : (
                                                        <>
                                                          <button
                                                            onClick={() => toggleLesson(lesson.id)}
                                                            className="text-left text-sm font-medium text-slate-800 hover:underline"
                                                          >
                                                            {expandedLesson === lesson.id ? '▾' : '▸'} {lesson.name} (
                                                            {lesson.duration_hours}h)
                                                          </button>
                                                          <div className="flex items-center gap-3">
                                                            <button
                                                              onClick={() => setEditingLesson(lesson.id)}
                                                              className="text-xs text-slate-600 hover:underline"
                                                            >
                                                              Editar
                                                            </button>
                                                            <button
                                                              onClick={() =>
                                                                handleDelete(
                                                                  `/training/lessons/${lesson.id}`,
                                                                  async () => {
                                                                    const data =
                                                                      (await loadJson<LessonT[]>(
                                                                        `/training/sub-units/${subUnit.id}/lessons`,
                                                                      )) ?? [];
                                                                    setLessonsBySubUnit((prev) => ({
                                                                      ...prev,
                                                                      [subUnit.id]: data,
                                                                    }));
                                                                  },
                                                                )
                                                              }
                                                              className="text-xs text-red-600 hover:underline"
                                                            >
                                                              Excluir
                                                            </button>
                                                          </div>
                                                        </>
                                                      )}
                                                    </div>

                                                    {expandedLesson === lesson.id && (
                                                      <div className="border-t border-slate-100 px-3 py-3 pl-6">
                                                        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">
                                                          Materiais
                                                        </h4>
                                                        <MaterialForm
                                                          onSubmit={(name, type, fileUrlOrHtml) =>
                                                            handleCreate(
                                                              '/training/materials',
                                                              {
                                                                lesson_id: lesson.id,
                                                                name,
                                                                type,
                                                                ...(type === 'TEXTO'
                                                                  ? { content_html: fileUrlOrHtml }
                                                                  : type === 'VIDEO_EXTERNO'
                                                                    ? { file_url: fileUrlOrHtml }
                                                                    : {}),
                                                              },
                                                              async () => {
                                                                const data =
                                                                  (await loadJson<MaterialT[]>(
                                                                    `/training/lessons/${lesson.id}/materials`,
                                                                  )) ?? [];
                                                                setMaterialsByLesson((prev) => ({
                                                                  ...prev,
                                                                  [lesson.id]: data,
                                                                }));
                                                              },
                                                            )
                                                          }
                                                        />
                                                        <ul className="mt-2 space-y-2">
                                                          {(materialsByLesson[lesson.id] ?? []).map((material) =>
                                                            editingMaterial === material.id ? (
                                                              <li
                                                                key={material.id}
                                                                className="rounded border border-slate-200 px-3 py-2 text-sm"
                                                              >
                                                                <MaterialEditForm
                                                                  material={material}
                                                                  onSubmit={(name, contentOrFileUrl) =>
                                                                    handleUpdate(
                                                                      `/training/materials/${material.id}`,
                                                                      {
                                                                        name,
                                                                        ...(material.type === 'TEXTO'
                                                                          ? { content_html: contentOrFileUrl }
                                                                          : material.type === 'VIDEO_EXTERNO'
                                                                            ? { file_url: contentOrFileUrl }
                                                                            : {}),
                                                                      },
                                                                      async () => {
                                                                        const data =
                                                                          (await loadJson<MaterialT[]>(
                                                                            `/training/lessons/${lesson.id}/materials`,
                                                                          )) ?? [];
                                                                        setMaterialsByLesson((prev) => ({
                                                                          ...prev,
                                                                          [lesson.id]: data,
                                                                        }));
                                                                        setEditingMaterial(null);
                                                                      },
                                                                    )
                                                                  }
                                                                  onCancel={() => setEditingMaterial(null)}
                                                                />
                                                              </li>
                                                            ) : (
                                                              <li
                                                                key={material.id}
                                                                className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm"
                                                              >
                                                                <div>
                                                                  <span className="font-medium">
                                                                    {material.name}
                                                                  </span>{' '}
                                                                  <span className="text-xs text-slate-500">
                                                                    ({material.type})
                                                                  </span>
                                                                  {material.type === 'ARQUIVO' &&
                                                                    !material.file_url && (
                                                                      <label className="ml-3 cursor-pointer text-xs text-slate-600 underline">
                                                                        Enviar arquivo
                                                                        <input
                                                                          type="file"
                                                                          className="hidden"
                                                                          onChange={(event) => {
                                                                            const file = event.target.files?.[0];
                                                                            if (file)
                                                                              handleUploadMaterialFile(
                                                                                material.id,
                                                                                lesson.id,
                                                                                file,
                                                                              );
                                                                          }}
                                                                        />
                                                                      </label>
                                                                    )}
                                                                  {material.type === 'ARQUIVO' &&
                                                                    material.file_url && (
                                                                      <span className="ml-3 text-xs text-emerald-600">
                                                                        Arquivo enviado
                                                                      </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                  <button
                                                                    onClick={() => setEditingMaterial(material.id)}
                                                                    className="text-xs text-slate-600 hover:underline"
                                                                  >
                                                                    Editar
                                                                  </button>
                                                                  <button
                                                                    onClick={() =>
                                                                      handleDelete(
                                                                        `/training/materials/${material.id}`,
                                                                        async () => {
                                                                          const data =
                                                                            (await loadJson<MaterialT[]>(
                                                                              `/training/lessons/${lesson.id}/materials`,
                                                                            )) ?? [];
                                                                          setMaterialsByLesson((prev) => ({
                                                                            ...prev,
                                                                            [lesson.id]: data,
                                                                          }));
                                                                        },
                                                                      )
                                                                    }
                                                                    className="text-xs text-red-600 hover:underline"
                                                                  >
                                                                    Excluir
                                                                  </button>
                                                                </div>
                                                              </li>
                                                            ),
                                                          )}
                                                          {(materialsByLesson[lesson.id] ?? []).length === 0 && (
                                                            <p className="text-xs text-slate-400">
                                                              Nenhum material cadastrado.
                                                            </p>
                                                          )}
                                                        </ul>

                                                        <QuizSection
                                                          lessonId={lesson.id}
                                                          quiz={quizByLesson[lesson.id] ?? null}
                                                          authedFetch={authedFetch}
                                                          onQuizChange={(quiz) =>
                                                            setQuizByLesson((prev) => ({
                                                              ...prev,
                                                              [lesson.id]: quiz,
                                                            }))
                                                          }
                                                        />
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {(segments ?? []).length === 0 && (
          <p className="text-sm text-slate-400">Nenhum segmento cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}

function AddForm({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (name: string, order: number) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('0');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), Number(order) || 0);
    setName('');
    setOrder('0');
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-slate-600 hover:underline">
        + Adicionar
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={placeholder}
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        type="number"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Ordem"
      />
      <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
        Salvar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
        Cancelar
      </button>
    </form>
  );
}

function EditForm({
  initialName,
  initialOrder,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  initialOrder: number;
  onSubmit: (name: string, order: number) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState(initialName);
  const [order, setOrder] = useState(String(initialOrder));

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), Number(order) || 0);
  }

  return (
    <form onSubmit={submit} className="flex flex-1 items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        type="number"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Ordem"
      />
      <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
        Salvar
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500">
        Cancelar
      </button>
    </form>
  );
}

function LessonEditForm({
  initialName,
  initialOrder,
  initialDuration,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  initialOrder: number;
  initialDuration: number;
  onSubmit: (name: string, order: number, durationHours: number) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState(initialName);
  const [order, setOrder] = useState(String(initialOrder));
  const [duration, setDuration] = useState(String(initialDuration));

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), Number(order) || 0, Number(duration) || 1);
  }

  return (
    <form onSubmit={submit} className="flex flex-1 items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
        type="number"
        step="0.5"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Carga horária (h)"
      />
      <input
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        type="number"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Ordem"
      />
      <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
        Salvar
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-slate-500">
        Cancelar
      </button>
    </form>
  );
}

function MaterialEditForm({
  material,
  onSubmit,
  onCancel,
}: {
  material: MaterialT;
  onSubmit: (name: string, contentOrFileUrl: string) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState(material.name);
  const [value, setValue] = useState(
    material.type === 'TEXTO' ? (material.content_html ?? '') : (material.file_url ?? ''),
  );

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), value.trim());
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <span className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-500">{material.type}</span>
      </div>
      {material.type === 'VIDEO_EXTERNO' && (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://..."
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      {material.type === 'TEXTO' && (
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Conteúdo em HTML"
          rows={3}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
          Salvar
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-slate-500">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function LessonForm({
  onSubmit,
}: {
  onSubmit: (name: string, order: number, durationHours: number) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState('0');
  const [duration, setDuration] = useState('1');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), Number(order) || 0, Number(duration) || 1);
    setName('');
    setOrder('0');
    setDuration('1');
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-slate-600 hover:underline">
        + Adicionar lição
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nome da lição"
        className="rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
        type="number"
        step="0.5"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Carga horária (h)"
      />
      <input
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        type="number"
        className="w-16 rounded border border-slate-300 px-2 py-1 text-xs"
        title="Ordem"
      />
      <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
        Salvar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
        Cancelar
      </button>
    </form>
  );
}

function MaterialForm({
  onSubmit,
}: {
  onSubmit: (name: string, type: 'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO', fileUrlOrHtml: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'ARQUIVO' | 'VIDEO_EXTERNO' | 'TEXTO'>('ARQUIVO');
  const [value, setValue] = useState('');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), type, value.trim());
    setName('');
    setValue('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-slate-600 hover:underline">
        + Adicionar material
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded border border-slate-200 p-2">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do material"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <select
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
          className="rounded border border-slate-300 px-2 py-1 text-xs"
        >
          <option value="ARQUIVO">Arquivo (PDF/slide/vídeo curto)</option>
          <option value="VIDEO_EXTERNO">Vídeo externo (link)</option>
          <option value="TEXTO">Texto</option>
        </select>
      </div>
      {type === 'VIDEO_EXTERNO' && (
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://..."
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      {type === 'TEXTO' && (
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Conteúdo em HTML"
          rows={3}
          className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
        />
      )}
      {type === 'ARQUIVO' && (
        <p className="text-xs text-slate-500">O upload do arquivo é feito depois de criar o material.</p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
          Salvar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function QuizSection({
  lessonId,
  quiz,
  authedFetch,
  onQuizChange,
}: {
  lessonId: string;
  quiz: QuizT | null;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onQuizChange: (quiz: QuizT | null) => void;
}): React.ReactElement {
  const [title, setTitle] = useState('');

  async function createQuiz(): Promise<void> {
    if (!title.trim()) return;
    const response = await authedFetch('/lms/quizzes', {
      method: 'POST',
      body: JSON.stringify({ lesson_id: lessonId, title: title.trim() }),
    });
    if (!response.ok) return;
    const body = await response.json();
    onQuizChange({ ...body.data, questions: [] });
    setTitle('');
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Quiz formativo</h4>
      {!quiz ? (
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Título do quiz"
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          />
          <button onClick={createQuiz} className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
            Criar quiz
          </button>
        </div>
      ) : (
        <QuizQuestions quiz={quiz} authedFetch={authedFetch} onQuizChange={onQuizChange} />
      )}
    </div>
  );
}

function QuizQuestions({
  quiz,
  authedFetch,
  onQuizChange,
}: {
  quiz: QuizT;
  authedFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onQuizChange: (quiz: QuizT) => void;
}): React.ReactElement {
  const [prompt, setPrompt] = useState('');

  async function reloadQuiz(): Promise<void> {
    const response = await authedFetch(`/lms/quizzes/${quiz.id}`);
    if (!response.ok) return;
    const body = await response.json();
    onQuizChange(body.data);
  }

  async function addQuestion(): Promise<void> {
    if (!prompt.trim()) return;
    const response = await authedFetch('/lms/quiz-questions', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quiz.id, prompt: prompt.trim() }),
    });
    if (!response.ok) return;
    setPrompt('');
    await reloadQuiz();
  }

  async function addOption(questionId: string, text: string, isCorrect: boolean): Promise<void> {
    if (!text.trim()) return;
    const response = await authedFetch('/lms/quiz-options', {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, text: text.trim(), is_correct: isCorrect }),
    });
    if (!response.ok) return;
    await reloadQuiz();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-800">{quiz.title}</p>
      {quiz.questions.map((question) => (
        <div key={question.id} className="rounded border border-slate-200 p-2">
          <p className="text-xs font-medium text-slate-700">{question.prompt}</p>
          <ul className="mt-1 space-y-1">
            {question.options.map((option) => (
              <li key={option.id} className="text-xs text-slate-600">
                {option.is_correct ? '✓' : '·'} {option.text}
              </li>
            ))}
          </ul>
          <OptionForm onAdd={(text, isCorrect) => addOption(question.id, text, isCorrect)} />
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Nova pergunta"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
        />
        <button onClick={addQuestion} className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
          Adicionar pergunta
        </button>
      </div>
    </div>
  );
}

function OptionForm({ onAdd }: { onAdd: (text: string, isCorrect: boolean) => void }): React.ReactElement {
  const [text, setText] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Nova opção"
        className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
      />
      <label className="flex items-center gap-1 text-xs text-slate-600">
        <input type="checkbox" checked={isCorrect} onChange={(event) => setIsCorrect(event.target.checked)} />
        Correta
      </label>
      <button
        onClick={() => {
          onAdd(text, isCorrect);
          setText('');
          setIsCorrect(false);
        }}
        className="rounded border px-2 py-1 text-xs"
      >
        + Opção
      </button>
    </div>
  );
}
