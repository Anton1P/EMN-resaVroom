import { createTrip, updateTripInfo } from "../src/lib/services/trip-service";
import { prisma } from "../src/lib/prisma";

async function runTests() {
  console.log("Démarrage des tests de validation de la délégation admin...");
  
  // Clean up any previous test trips
  await prisma.trip.deleteMany();

  const vehicles = await prisma.vehicle.findMany();
  const campuses = await prisma.campus.findMany();

  const v1 = vehicles[0].id;
  const v2 = vehicles[1].id;
  const v3 = vehicles[2].id;

  const origin = campuses[0].id;
  const dest = campuses[1].id;

  const now = new Date();
  const departureTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain
  const estimatedArrivalTime = new Date(departureTime.getTime() + 2 * 60 * 60 * 1000);

  // Admin Infos
  const adminEntraId = "TO_BE_CONFIGURED";
  const adminEmail = "admin@entreprise.fr";
  const adminName = "Admin Dev";

  // Utilisateurs cibles
  const marieEntraId = "dev-user-entra-002";
  const jeanEntraId = "dev-user-entra-001";

  try {
    // ----------------------------------------------------
    // TEST 1 : Créer pour soi-même
    // ----------------------------------------------------
    console.log("\n--- TEST 1 : Admin crée un trajet pour lui-même ---");
    const trip1 = await createTrip({
      vehicleId: v1,
      driverEntraId: adminEntraId,
      driverEmail: adminEmail,
      driverDisplayName: adminName,
      type: "ONE_WAY",
      originCampusId: origin,
      destinationCampusId: dest,
      departureTime,
      estimatedArrivalTime,
    });
    console.log("✅ TEST 1 REUSSI : Trajet créé pour Admin Dev (ID:", trip1.id, ")");

    // ----------------------------------------------------
    // TEST 2 : Créer pour Marie Martin
    // ----------------------------------------------------
    console.log("\n--- TEST 2 : Admin crée un trajet pour Marie Martin ---");
    const trip2 = await createTrip({
      vehicleId: v2,
      driverEntraId: marieEntraId,
      driverEmail: "marie.martin@entreprise.fr",
      driverDisplayName: "Marie Martin",
      type: "ONE_WAY",
      originCampusId: origin,
      destinationCampusId: dest,
      departureTime,
      estimatedArrivalTime,
    });
    console.log("✅ TEST 2 REUSSI : Trajet créé pour Marie Martin (ID:", trip2.id, ")");

    // ----------------------------------------------------
    // TEST 4 : Modifier le conducteur du Trip 1 vers Jean Dupont
    // ----------------------------------------------------
    console.log("\n--- TEST 4 : Admin modifie le trajet 1 pour l'attribuer à Jean Dupont ---");
    const trip4 = await updateTripInfo(
      trip1.id,
      {
        driverEntraId: jeanEntraId,
        driverEmail: "jean.dupont@entreprise.fr",
        driverDisplayName: "Jean Dupont",
      },
      adminEntraId,
      adminEmail,
      true // isAdmin
    );
    console.log("✅ TEST 4 REUSSI : Conducteur modifié vers Jean Dupont (ID:", trip4.id, ")");

    // ----------------------------------------------------
    // TEST 3 : Conflit de création pour Jean Dupont
    // ----------------------------------------------------
    console.log("\n--- TEST 3 : Admin tente de créer un trajet sur le même créneau pour Jean Dupont ---");
    try {
      await createTrip({
        vehicleId: v3,
        driverEntraId: jeanEntraId,
        driverEmail: "jean.dupont@entreprise.fr",
        driverDisplayName: "Jean Dupont",
        type: "ONE_WAY",
        originCampusId: origin,
        destinationCampusId: dest,
        departureTime,
        estimatedArrivalTime,
      });
      console.log("❌ TEST 3 ECHOUÉ : Le trajet a été créé au lieu d'être refusé !");
    } catch (error: any) {
      if (error.name === "DriverOverlapError") {
        console.log("✅ TEST 3 REUSSI : Le système a correctement refusé la création avec DriverOverlapError.");
      } else {
        console.log("❌ TEST 3 ECHOUÉ : Une erreur est survenue mais pas celle attendue:", error);
      }
    }

  } catch (error) {
    console.error("❌ ERREUR FATALE DURANT LES TESTS :", error);
  } finally {
    console.log("\nFin des tests.");
  }
}

runTests();
