'use client';

import { useEffect, useState } from 'react';
import { InstitutionService } from '@/services/institution.service';
import type { Institution } from '@/services/institution.service';

export default function InstitutionsPage() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadInstitutions();
    }, []);

    const loadInstitutions = async () => {
        const data = await InstitutionService.getAll();
        setInstitutions(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !newName) return;
        try {
            await InstitutionService.create(newCode, { name: newName });
            setNewCode('');
            setNewName('');
            loadInstitutions();
        } catch (err) {
            console.error('Error creating institution:', err);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Gestión de Instituciones</h1>
            
            <form onSubmit={handleCreate} className="p-4 border rounded-lg space-y-4">
                <h3 className="font-medium">Crear Nueva Institución</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        placeholder="Código (ej: UPC-VALLEDUPAR)"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        className="h-10 rounded-md border border-input px-3 text-sm"
                    />
                    <input
                        placeholder="Nombre de la institución"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-10 rounded-md border border-input px-3 text-sm"
                    />
                </div>
                <button type="submit" className="h-10 px-4 bg-primary text-primary-foreground rounded-md text-sm">
                    Crear Institución
                </button>
            </form>

            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="border rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3">Código</th>
                                <th className="text-left p-3">Nombre</th>
                            </tr>
                        </thead>
                        <tbody>
                            {institutions.map(inst => (
                                <tr key={inst.id} className="border-b">
                                    <td className="p-3">{inst.id}</td>
                                    <td className="p-3">{inst.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
