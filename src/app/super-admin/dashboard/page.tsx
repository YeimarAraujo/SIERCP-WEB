export default function SuperAdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard Global SIERCP</h1>
            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Instituciones</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Instructores</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
                <div className="p-4 border rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">Total Estudiantes</h3>
                    <p className="text-2xl font-bold">0</p>
                </div>
            </div>
            <p className="text-muted-foreground">Estadísticas globales de la plataforma.</p>
        </div>
    );
}
