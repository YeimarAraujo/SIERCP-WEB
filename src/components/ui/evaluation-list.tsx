'use client';

import type { SIERCPEvaluation } from '@/lib/dashboard-data';

interface EvaluationListProps {
    evaluations: SIERCPEvaluation[];
    loading?: boolean;
    onViewDetail?: (evaluation: SIERCPEvaluation) => void;
}

const getScoreColor = (score: number) =>
    score >= 85 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-rose-600';

const getScoreBg = (score: number) =>
    score >= 85 ? 'bg-emerald-50' : score >= 70 ? 'bg-amber-50' : 'bg-rose-50';

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'approve': return 'Aprobado';
        case 'retake': return 'Reintento Sugerido';
        default: return 'Pendiente';
    }
};

export function EvaluationList({
    evaluations,
    loading = false,
    onViewDetail,
}: EvaluationListProps) {
    if (loading) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Últimas Evaluaciones</h3>
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-2xl mb-2 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Últimas Evaluaciones</h3>
            </div>

            {evaluations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                    No hay evaluaciones registradas
                </div>
            ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-2 relative">
                    {/* Scrollbar */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-100 rounded-full">
                        <div className="w-1 h-12 bg-slate-300 rounded-full" />
                    </div>

                    {evaluations.map((evaluation) => {
                        const scoreColor = getScoreColor(evaluation.score);
                        const scoreBg = getScoreBg(evaluation.score);
                        const statusLabel = getStatusLabel(evaluation.status);

                        return (
                            <div
                                key={evaluation.id}
                                onClick={() => onViewDetail?.(evaluation)}
                                className="flex items-center justify-between p-3 bg-white border border-slate-50 shadow-sm rounded-2xl transition-all
                                hover:shadow-md hover:scale-[1.01] cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${scoreBg} ${scoreColor} flex items-center justify-center font-bold text-sm`}>
                                        {evaluation.studentInitials}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-700">
                                            {evaluation.studentName}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {evaluation.date} · {evaluation.courseName}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${scoreColor}`}>
                                        {evaluation.score}% Score
                                    </div>
                                    <div className="text-[10px] text-slate-500">{statusLabel}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
