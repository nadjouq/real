import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configuration CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    console.log('Début de la récupération des véhicules...');
    
    // D'abord, vérifions les structures disponibles
    const structures = await prisma.structure.findMany({
      select: {
        code_structure: true,
        designation: true,
      },
    });
    console.log('Structures disponibles:', JSON.stringify(structures, null, 2));

    const vehicles = await prisma.vehicule.findMany({
      select: {
        code_vehicule: true,
        n_immatriculation: true,
        FK_vehicule_REF_type: {
          select: {
            designation: true,
            FK_type_REF_marque: {
              select: {
                designation: true,
              },
            },
          },
        },
        historique_status: {
          take: 1,
          orderBy: {
            date: 'desc',
          },
          select: {
            status: {
              select: {
                designation: true,
              },
            },
          },
        },
        affectations: {
          take: 1,
          orderBy: {
            date: 'desc',
          },
          select: {
            structure: {
              select: {
                code_structure: true,
                designation: true,
                type_structure_hierachique: true,
              },
            },
          },
        },
        kilo_heure: {
          take: 1,
          orderBy: {
            date: 'desc',
          },
          select: {
            kilo_parcouru_heure_fonctionnement: true,
            date: true,
          },
        },
      },
    });

    console.log('Nombre de véhicules trouvés:', vehicles.length);
    if (vehicles.length > 0) {
      console.log('Premier véhicule complet:', JSON.stringify(vehicles[0], null, 2));
      console.log('Structure du premier véhicule:', JSON.stringify(vehicles[0].affectations?.[0]?.structure, null, 2));
    }

    // Transformer les données pour correspondre au format attendu par l'application mobile
    const formattedVehicles = vehicles.map((vehicle: any) => {
      const structure = vehicle.affectations?.[0]?.structure;
      console.log('Structure avant formatage:', JSON.stringify(structure, null, 2));
      
      return {
        code: vehicle.code_vehicule,
        matricule: vehicle.n_immatriculation,
        marque: vehicle.FK_vehicule_REF_type?.FK_type_REF_marque?.designation || '',
        type: vehicle.FK_vehicule_REF_type?.designation || '',
        statut: vehicle.historique_status?.[0]?.status?.designation || '',
        structure: structure?.designation || 'Non affecté',
        kmTotal: vehicle.kilo_heure?.[0]?.kilo_parcouru_heure_fonctionnement?.toString() || '0',
        derniereMaj: vehicle.kilo_heure?.[0]?.date?.toString() || 'Non disponible',
      };
    });

    if (formattedVehicles.length > 0) {
      console.log('Premier véhicule formaté:', JSON.stringify(formattedVehicles[0], null, 2));
    }

    return NextResponse.json(formattedVehicles, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Erreur détaillée lors de la récupération des véhicules:', error);
    return NextResponse.json(
      { error: `Erreur lors de la récupération des véhicules: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
} 