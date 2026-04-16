
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  // Récupérer quelques métriques globales
  const [totalVehicles, maintenanceVehicles, activeTrips, totalAdmins] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "MAINTENANCE" } }),
    prisma.trip.count({ where: { status: "SCHEDULED", departureTime: { gte: new Date() } } }),
    prisma.admin.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord administrateur</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
        <div className="card text-center">
          <h3 className="text-lg text-muted">Véhicules Totaux</h3>
          <p className="text-3xl font-bold" style={{ marginTop: "0.5rem" }}>{totalVehicles}</p>
        </div>

        <div className="card text-center" style={{ borderLeft: maintenanceVehicles > 0 ? "4px solid var(--color-danger)" : "" }}>
          <h3 className="text-lg text-muted">En Maintenance</h3>
          <p className="text-3xl font-bold" style={{ marginTop: "0.5rem", color: maintenanceVehicles > 0 ? "var(--color-danger)" : "inherit" }}>
            {maintenanceVehicles}
          </p>
        </div>

        <div className="card text-center">
          <h3 className="text-lg text-muted">Trajets à venir</h3>
          <p className="text-3xl font-bold" style={{ marginTop: "0.5rem" }}>{activeTrips}</p>
        </div>

        <div className="card text-center">
          <h3 className="text-lg text-muted">Administrateurs</h3>
          <p className="text-3xl font-bold" style={{ marginTop: "0.5rem" }}>{totalAdmins}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 className="text-xl font-bold mb-4">Bienvenue dans l&#39;espace d&#39;administration</h2>
        <p className="text-muted">
          Utilisez le menu latéral pour gérer la flotte de véhicules, consulter et annuler des trajets,
          ou paramétrer l&#39;application (ajout d&#39;admins, temps de buffer, etc.).
        </p>
      </div>
    </div>
  );
}
